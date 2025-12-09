import os
import joblib
import numpy as np
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.naive_bayes import MultinomialNB
from typing import List, Tuple, Optional
import json

MODELS_DIR = "user_models"

# Criar diretório se não existir
os.makedirs(MODELS_DIR, exist_ok=True)


class ModelManager:
    def __init__(self):
        self.models = {} 
        self.vectorizers = {}  

    def get_model_path(self, userId: int) -> Tuple[str, str, str]:
        """Retorna os caminhos dos arquivos do modelo"""
        model_path = os.path.join(MODELS_DIR, f"{userId}.joblib")
        vectorizer_path = os.path.join(MODELS_DIR, f"{userId}_vectorizer.joblib")
        training_history_path = os.path.join(MODELS_DIR, f"{userId}_history.json")
        return model_path, vectorizer_path, training_history_path

    def load_training_history(self, userId: int) -> List[dict]:
        """Carrega histórico de treinamento"""
        _, _, history_path = self.get_model_path(userId)
        if os.path.exists(history_path):
            try:
                with open(history_path, 'r', encoding='utf-8') as f:
                    return json.load(f)
            except Exception as e:
                print(f"Erro ao carregar histórico para userId {userId}: {e}")
        return []

    def save_training_history(self, userId: int, history: List[dict]):
        """Salva histórico de treinamento"""
        _, _, history_path = self.get_model_path(userId)
        try:
            with open(history_path, 'w', encoding='utf-8') as f:
                json.dump(history, f, ensure_ascii=False, indent=2)
        except Exception as e:
            print(f"Erro ao salvar histórico para userId {userId}: {e}")

    def load_model(self, userId: int) -> Tuple[Optional[MultinomialNB], Optional[TfidfVectorizer]]:
        """Carrega modelo e vectorizer do usuário"""
        model_path, vectorizer_path, _ = self.get_model_path(userId)

       
        if userId in self.models and userId in self.vectorizers:
            return self.models[userId], self.vectorizers[userId]

   
        model = None
        vectorizer = None

        if os.path.exists(model_path) and os.path.exists(vectorizer_path):
            try:
                model = joblib.load(model_path)
                vectorizer = joblib.load(vectorizer_path)
         
                self.models[userId] = model
                self.vectorizers[userId] = vectorizer
            except Exception as e:
                print(f"Erro ao carregar modelo para userId {userId}: {e}")

        return model, vectorizer

    def create_new_model(self) -> Tuple[MultinomialNB, TfidfVectorizer]:
        """Cria um novo modelo e vectorizer"""
        vectorizer = TfidfVectorizer(
            max_features=1000,
            ngram_range=(1, 2),
            stop_words=None, 
            lowercase=True
        )
        model = MultinomialNB(alpha=1.0) 
        return model, vectorizer

    def train(
        self,
        userId: int,
        transactionName: str,
        category: str
    ) -> bool:
        """Treina o modelo incrementalmente"""
        try:
      
            history = self.load_training_history(userId)
            
            # Adicionar novo exemplo ao histórico
            history.append({
                "transactionName": transactionName,
                "category": category
            })
            
            # Carregar modelo existente
            model, vectorizer = self.load_model(userId)
            
            # Verificar se precisa recriar modelo (nova classe detectada)
            existing_classes = set(model.classes_) if model is not None else set()
            needs_rebuild = model is None or category not in existing_classes
            
            if needs_rebuild:
                # Recriar modelo com todas as classes conhecidas
                print(f"Recriando modelo para userId {userId} - nova classe detectada: {category}")
                
                # Extrair todas as classes únicas do histórico
                all_categories = list(set([h["category"] for h in history]))
                all_categories.sort()  # Ordenar para consistência
                
                # Criar novo modelo e vectorizer
                model, vectorizer = self.create_new_model()
                
                # Preparar todos os dados de treinamento
                all_names = [h["transactionName"] for h in history]
                all_labels = [h["category"] for h in history]
                
                # Fit do vectorizer com todos os dados
                X = vectorizer.fit_transform(all_names)
                y = np.array(all_labels)
                
                # Treinar modelo com todas as classes
                model.partial_fit(X, y, classes=np.array(all_categories))
            else:
                # Categoria já existe
                X = vectorizer.transform([transactionName])
                y = np.array([category])
                # Usa as classes existentes do modelo
                model.partial_fit(X, y)

            # Salvar modelo e histórico
            model_path, vectorizer_path, history_path = self.get_model_path(userId)
            joblib.dump(model, model_path)
            joblib.dump(vectorizer, vectorizer_path)
            self.save_training_history(userId, history)

            # Atualizar cache
            self.models[userId] = model
            self.vectorizers[userId] = vectorizer

            return True
        except Exception as e:
            print(f"Erro ao treinar modelo para userId {userId}: {e}")
            import traceback
            traceback.print_exc()
            return False

    def classify(
        self,
        userId: int,
        transactions: List[dict]
    ) -> List[dict]:
        """Classifica transações"""
        model, vectorizer = self.load_model(userId)

        if model is None or vectorizer is None:
          
            return [
                {
                    "id": tx.get("id"),
                    "predictedCategory": None,
                    "confidence": 0.0
                }
                for tx in transactions
            ]

        try:
            # Extrair nomes das transações
            transaction_names = [tx.get("name", "") for tx in transactions]

            # Transformar texto em features
            X = vectorizer.transform(transaction_names)

            # Prever categorias
            predictions = model.predict(X)
            probabilities = model.predict_proba(X)

            # Calcular confiança
            confidences = np.max(probabilities, axis=1)

            # Montar resposta
            results = []
            for i, tx in enumerate(transactions):
                results.append({
                    "id": tx.get("id"),
                    "predictedCategory": predictions[i] if confidences[i] > 0.1 else None,
                    "confidence": float(confidences[i])
                })

            return results
        except Exception as e:
            print(f"Erro ao classificar transações para userId {userId}: {e}")
   
            return [
                {
                    "id": tx.get("id"),
                    "predictedCategory": None,
                    "confidence": 0.0
                }
                for tx in transactions
            ]

    def reinforce(
        self,
        userId: int,
        transactionName: str,
        correctCategory: str
    ) -> bool:
        """Reforça o modelo com correção do usuário"""
        
        return self.train(userId, transactionName, correctCategory)


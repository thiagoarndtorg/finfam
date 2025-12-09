from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
from model_manager import ModelManager

app = FastAPI(title="ML Categorization Service", version="1.0.0")

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Em produção, especificar origens
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

model_manager = ModelManager()


# Request/Response Models
class TrainRequest(BaseModel):
    userId: int
    transactionName: str
    category: str


class TransactionItem(BaseModel):
    id: int
    name: str


class ClassifyRequest(BaseModel):
    userId: int
    transactions: List[TransactionItem]


class ClassificationResult(BaseModel):
    id: int
    predictedCategory: Optional[str]
    confidence: float


class ReinforceRequest(BaseModel):
    userId: int
    transactionName: str
    correctCategory: str


# Endpoints
@app.post("/train", response_model=dict)
async def train_model(request: TrainRequest):
    """Treina o modelo de um usuário"""
    try:
        success = model_manager.train(
            userId=request.userId,
            transactionName=request.transactionName,
            category=request.category
        )
        
        if success:
            return {"status": "success", "message": "Model trained successfully"}
        else:
            raise HTTPException(status_code=500, detail="Failed to train model")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/classify", response_model=List[ClassificationResult])
async def classify_transactions(request: ClassifyRequest):
    """Classifica transações"""
    try:
        # Converter para dict para compatibilidade
        transactions_dict = [
            {"id": tx.id, "name": tx.name}
            for tx in request.transactions
        ]
        
        results = model_manager.classify(
            userId=request.userId,
            transactions=transactions_dict
        )
        
        return results
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/reinforce", response_model=dict)
async def reinforce_model(request: ReinforceRequest):
    """Reforça o modelo com correção do usuário"""
    try:
        success = model_manager.reinforce(
            userId=request.userId,
            transactionName=request.transactionName,
            correctCategory=request.correctCategory
        )
        
        if success:
            return {"status": "success", "message": "Model reinforced successfully"}
        else:
            raise HTTPException(status_code=500, detail="Failed to reinforce model")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy"}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=5000)


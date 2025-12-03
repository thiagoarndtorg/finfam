package com.example.finfam.config;

import org.hibernate.resource.jdbc.spi.StatementInspector;

public class H2StatementInspector implements StatementInspector {
    
    @Override
    public String inspect(String sql) {
        if (sql == null) return null;
        
        String result = sql;
        
        if (result.contains("fin_fam_db.")) {
            result = result.replaceAll("fin_fam_db\\.", "");
        }
        
        result = result.replaceAll("\"\"month\"\"", "month_value");
        result = result.replaceAll("\"month\"", "month_value");
        result = result.replaceAll("b1_0\\.month(?![_a-zA-Z0-9])", "b1_0.month_value");
        result = result.replaceAll("b1_0\\.\\[\\*\\]month", "b1_0.month_value");
        result = result.replaceAll("\\bmonth\\b(?=\\s*[=,?])", "month_value");
        result = result.replaceAll("\\bmonth\\b(?=\\s*from)", "month_value");
        result = result.replaceAll("\\bmonth\\b(?=\\s*where)", "month_value");
        result = result.replaceAll("\\bmonth\\b(?=\\s*and)", "month_value");
        result = result.replaceAll("\\bmonth\\b(?=\\s*or)", "month_value");
        
        return result;
    }
}

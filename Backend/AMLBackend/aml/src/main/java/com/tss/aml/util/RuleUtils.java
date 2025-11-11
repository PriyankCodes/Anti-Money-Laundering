package com.tss.aml.util;

import java.math.BigDecimal;
import java.util.Map;
import java.util.Optional;

public class RuleUtils {
	public static String getString(Map<String, Object> m, String k) {
		return Optional.ofNullable(m).map(x -> x.get(k)).map(Object::toString).orElse(null);
	}

	public static Integer getInt(Map<String, Object> m, String k) {
		return Optional.ofNullable(m).map(x -> x.get(k)).filter(v -> v instanceof Number)
				.map(v -> ((Number) v).intValue()).orElse(null);
	}

	public static BigDecimal getBigDecimal(Map<String, Object> m, String k) {
		return Optional.ofNullable(m).map(x -> x.get(k)).map(Object::toString).map(BigDecimal::new).orElse(null);
	}
	
	// ✅ Add inside RuleUtils class
	public static boolean getBoolean(Map<String, Object> map, String key, boolean defaultValue) {
	    try {
	        if (map == null || key == null) return defaultValue;
	        Object value = map.get(key);
	        if (value == null) return defaultValue;

	        if (value instanceof Boolean) {
	            return (Boolean) value;
	        } else if (value instanceof String) {
	            return Boolean.parseBoolean((String) value);
	        } else if (value instanceof Number) {
	            return ((Number) value).intValue() != 0;
	        }
	    } catch (Exception ignored) {}
	    return defaultValue;
	}

}
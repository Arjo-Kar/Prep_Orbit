package com.preporbit.prep_orbit.util;

public class JsonUtils {
    // Extracts the first valid JSON object from a string
    public static String extractFirstJsonObject(String input) {
        if (input == null) return null;
        int start = input.indexOf('{');
        int end = input.lastIndexOf('}');
        if (start != -1 && end != -1 && end > start) {
            return input.substring(start, end + 1);
        }
        return null;
    }
}
package com.preporbit.prep_orbit.dto;

import com.fasterxml.jackson.core.JsonParser;
import com.fasterxml.jackson.databind.DeserializationContext;
import com.fasterxml.jackson.databind.JsonDeserializer;
import com.fasterxml.jackson.databind.JsonNode;

import java.io.IOException;
import java.util.ArrayList;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

public class ChoicesDeserializer extends JsonDeserializer<String[]> {
    @Override
    public String[] deserialize(JsonParser p, DeserializationContext ctxt) throws IOException {
        JsonNode node = p.getCodec().readTree(p);

        if (node.isArray()) {
            // Clean up items: remove leading/trailing quotes and spaces
            String[] result = new String[node.size()];
            for (int i = 0; i < node.size(); i++) {
                result[i] = node.get(i).asText().trim().replaceAll("^\"|\"$", "");
            }
            return result;
        } else if (node.isTextual()) {
            String value = node.asText().trim();

            // Try splitting by comma first
            String[] splitByComma = value.split("\\s*,\\s*");
            if (splitByComma.length > 1) {
                return splitByComma;
            }

            // Try splitting by regex for quoted options (e.g. "A. ...""B. ...")
            Pattern quotedOptionPattern = Pattern.compile("\"([A-D]\\. [^\"]+)\"");
            Matcher matcher = quotedOptionPattern.matcher(value);
            ArrayList<String> options = new ArrayList<>();
            while (matcher.find()) {
                options.add(matcher.group(1));
            }
            if (!options.isEmpty()) {
                return options.toArray(new String[0]);
            }

            // Fallback: Try splitting by option labels
            Pattern labelPattern = Pattern.compile("([A-D]\\.\\s[^A-D]*)");
            Matcher labelMatcher = labelPattern.matcher(value);
            while (labelMatcher.find()) {
                options.add(labelMatcher.group(1).trim());
            }
            if (!options.isEmpty()) {
                return options.toArray(new String[0]);
            }

            // If nothing works, return as single-item array
            return new String[]{value};
        } else if (node.isObject()) {
            String[] keys = {"A", "B", "C", "D"};
            ArrayList<String> result = new ArrayList<>();
            for (String key : keys) {
                if (node.has(key)) {
                    result.add(node.get(key).asText().trim());
                }
            }
            return result.toArray(new String[0]);
        } else {
            // Log error but don't throw, return empty
            System.err.println("Unable to deserialize choices/options: Unexpected format " + node.toString());
            return new String[0];
        }
    }
}
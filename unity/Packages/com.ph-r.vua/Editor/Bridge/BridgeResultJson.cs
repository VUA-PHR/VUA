using System;
using System.Collections;
using System.Collections.Generic;
using System.Globalization;
using System.Reflection;
using UnityEngine;

namespace Vua.Editor.Bridge
{
    // JsonUtility emits every default field, including empty optional hashes,
    // which violate the frozen v4 schema. Project only our own wire DTO fields;
    // no vendor reflection or extra serializer dependency. Legacy bytes stay unchanged.
    internal static class BridgeResultJson
    {
        [Serializable] private sealed class JsonString { public string value; }

        internal static string Serialize(BridgeResult result) => result.schemaVersion == 4
            ? Value(result) : JsonUtility.ToJson(result, true);

        private static string Quote(string value)
        {
            var wrapped = JsonUtility.ToJson(new JsonString { value = value });
            return wrapped.Substring(9, wrapped.Length - 10); // {"value":...}
        }

        private static string Value(object value)
        {
            if (value == null) return "null";
            if (value is string text) return Quote(text);
            if (value is bool flag) return flag ? "true" : "false";
            if (value is int number) return number.ToString(CultureInfo.InvariantCulture);
            if (value is IEnumerable sequence)
            {
                var items = new List<string>();
                foreach (var item in sequence) items.Add(Value(item));
                return "[" + string.Join(",", items) + "]";
            }
            var type = value.GetType();
            if (type != typeof(BridgeResult) && type != typeof(BridgeData) &&
                type != typeof(BridgeDiagnostic) && type != typeof(BridgeStep) && type != typeof(BridgeResolvedSource))
                throw new InvalidOperationException("Unsupported Bridge wire DTO: " + type.Name);
            var fields = new List<string>();
            foreach (var field in type.GetFields(BindingFlags.Public | BindingFlags.Instance))
            {
                var fieldValue = field.GetValue(value);
                if (fieldValue == null) continue;
                // A failure before production starts has no snapshot or execution data.
                if (value is BridgeResult receipt && field.Name == "data" &&
                    receipt.operation == "execute_production_job" && receipt.status == "failed" &&
                    !receipt.data.dryRun && string.IsNullOrEmpty(receipt.data.snapshotId)) continue;
                if (value is BridgeData && (field.Name == "commandFingerprint" || field.Name == "planHash" ||
                    field.Name == "snapshotId" || field.Name == "restoredFrom" || field.Name == "instanceGlobalObjectId") &&
                    string.IsNullOrEmpty(fieldValue as string)) continue;
                if (value is BridgeResolvedSource && field.Name == "warehouseItemId" &&
                    string.IsNullOrEmpty(fieldValue as string)) continue;
                fields.Add(Quote(field.Name) + ":" + Value(fieldValue));
            }
            return "{" + string.Join(",", fields) + "}";
        }
    }
}

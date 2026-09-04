import io

p = "src/main.rs"
s = io.open(p, encoding="utf-8").read()

needle = "VR_GetGenericInterface(\n"
i = s.find(needle)
print("getgeneric call found at char", i)
# 打印其后 3 行确认当前版本串形态
segment = s[i:i + 220]
print(repr(segment))

# 无论当前形态如何,统一改写为带 FnTable: 前缀
old_variants = [
    'b"IVROverlay_028\\0"',
    'b"FnTable:IVROverlay_028\\0"',
    'b"FnTable:FnTable:IVROverlay_028\\0"',
]
done = False
for variant in old_variants:
    if variant in s:
        s = s.replace(variant, 'b"FnTable:IVROverlay_028\\0"')
        done = True
        break
if not done:
    # 直接定位 b"IVROverlay..." 开头的字节串整体替换
    import re
    m = re.search(r'b"[^"]*IVROverlay[^"]*"', s)
    if m:
        s = s.replace(m.group(0), 'b"FnTable:IVROverlay_028\\0"')
        done = True
print("rewritten:", done)
io.open(p, "w", encoding="utf-8", newline="\n").write(s)

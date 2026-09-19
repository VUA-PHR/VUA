/** Local shell copy. IPC accepts a locale identifier, never caller-provided dialog text. */
export const dialogCopy = {
  en: { unityPackage: "Select a Unity package", unityPackageFilter: "Unity package", localVpm: "Select a local VPM package folder", warehouse: "Import asset folders", editorExecutable: "Select the Unity editor executable", editorDirectory: "Select the Unity editor folder" },
  "zh-CN": { unityPackage: "选择 Unity 素材包", unityPackageFilter: "Unity 素材包", localVpm: "选择本地 VPM 包文件夹", warehouse: "导入素材文件夹", editorExecutable: "选择 Unity 编辑器程序", editorDirectory: "选择 Unity 编辑器文件夹" },
  ja: { unityPackage: "Unity パッケージを選択", unityPackageFilter: "Unity パッケージ", localVpm: "ローカル VPM パッケージのフォルダーを選択", warehouse: "素材フォルダーをインポート", editorExecutable: "Unity エディターの実行ファイルを選択", editorDirectory: "Unity エディターのフォルダーを選択" },
  ko: { unityPackage: "Unity 패키지 선택", unityPackageFilter: "Unity 패키지", localVpm: "로컬 VPM 패키지 폴더 선택", warehouse: "에셋 폴더 가져오기", editorExecutable: "Unity 에디터 실행 파일 선택", editorDirectory: "Unity 에디터 폴더 선택" },
} as const;

export function dialogStrings(locale: unknown): typeof dialogCopy[keyof typeof dialogCopy] {
  return typeof locale === "string" && Object.hasOwn(dialogCopy, locale)
    ? dialogCopy[locale as keyof typeof dialogCopy]
    : dialogCopy.en;
}

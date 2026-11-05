import { useCareerSave } from "@/services/career/store";
export function SaveNotice() {
  const status = useCareerSave();
  return (
    <p
      role={status === "browser-saved" ? "status" : "alert"}
      className={`mt-3 text-sm ${status === "browser-saved" ? "text-muted-foreground" : "text-warn"}`}
    >
      {status === "browser-saved"
        ? "Practice stays in this browser. Return on the same device and browser to continue."
        : status === "corrupt"
          ? "Saved career data could not be read. The original data has not been overwritten. New work will replace this browser’s career snapshot."
          : "This browser could not save. Work is kept in memory only and will be lost on reload."}
    </p>
  );
}

export function SiteFooter() {
  return (
    <footer className="mt-auto border-t border-black/10 py-8 text-center text-xs text-black/40 dark:border-white/10 dark:text-white/40">
      © {new Date().getFullYear()} 연구랩 가이드
    </footer>
  );
}

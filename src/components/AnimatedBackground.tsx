export function AnimatedBackground() {
  return (
    <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
      {/* Gradient de fond */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-background to-accent/5 dark:from-primary/10 dark:via-background dark:to-accent/10" />
      
      {/* Orbes flottantes */}
      <div className="absolute top-20 left-10 w-72 h-72 bg-primary/20 dark:bg-primary/30 rounded-full blur-3xl animate-blob" />
      <div className="absolute top-40 right-20 w-96 h-96 bg-accent/20 dark:bg-accent/30 rounded-full blur-3xl animate-blob animation-delay-2000" />
      <div className="absolute -bottom-20 left-1/3 w-80 h-80 bg-secondary/20 dark:bg-secondary/30 rounded-full blur-3xl animate-blob animation-delay-4000" />
      
      {/* Grille subtile */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:14px_24px] dark:bg-[linear-gradient(to_right,#ffffff0a_1px,transparent_1px),linear-gradient(to_bottom,#ffffff0a_1px,transparent_1px)]" />
    </div>
  );
}

import Image from "next/image";

export default function Footer() {
  const year = new Date().getFullYear();
  return (
    <footer className="border-t border-peach bg-cream-soft mt-14">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 text-center">
        <Image
          src="https://almiworld.com/wp-content/uploads/2026/04/almi-latest.png"
          alt="AlmiWorld"
          width={120}
          height={40}
          className="h-10 w-auto mx-auto mb-4"
          unoptimized
        />
        <nav className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-sm text-plum-soft mb-3">
          <a href="https://almiworld.com" className="hover:text-coral transition-colors">AlmiWorld</a>
          <a href="https://almicv.almiworld.com" className="hover:text-coral transition-colors">AlmiCV</a>
          <a href="https://almijob.almiworld.com" className="hover:text-coral transition-colors">AlmiJob</a>
          <a href="https://almisalary.almiworld.com" className="hover:text-coral transition-colors">Salary Checker</a>
          <a href="https://almiworld.com/ebooks-2/" className="hover:text-coral transition-colors">eBooks</a>
        </nav>
        <p className="text-xs text-plum-soft">© {year} AlmiWorld. Live beautifully.</p>
      </div>
    </footer>
  );
}

export default function Home() {
  return (
    <main className="flex flex-1 items-center justify-center px-6 py-16">
      <div className="max-w-xl w-full text-center sm:text-left">
        <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight mb-4">
          AlmiStudy
        </h1>
        <p className="text-base sm:text-lg leading-relaxed mb-3">
          University directory for working migrants. Coming soon.
        </p>
        <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
          Read our principles:{" "}
          <a
            href="https://github.com/smnasiruz016-blip/almistudy/blob/main/docs/AlmiStudy_Product_Principles.md"
            target="_blank"
            rel="noopener noreferrer"
            className="underline hover:text-zinc-900 dark:hover:text-zinc-100"
          >
            docs/AlmiStudy_Product_Principles.md
          </a>
          .
        </p>
      </div>
    </main>
  );
}

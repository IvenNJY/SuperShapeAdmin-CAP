export default function ErrorPage() {
    return (
        <div className="max-w-3xl flex flex-col mx-auto size-full justify-center items-center h-screen">

        {/* ========== MAIN CONTENT ========== */}
        <main id="content" className="margin-auto block">
            <div className="text-center py-10 px-4 sm:px-6 lg:px-8">
            <h1 className="block text-7xl font-bold text-gray-800 sm:text-9xl">404</h1>
            <p className="mt-3 text-gray-600">Oops, something went wrong.</p>
            <p className="text-gray-600">Sorry, we couldn't find your page.</p>
            </div>
        </main>
        {/* ========== END MAIN CONTENT ========== */}


        </div>
    );
}
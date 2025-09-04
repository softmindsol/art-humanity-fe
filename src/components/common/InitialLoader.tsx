
const InitialLoader = ({ progress, message, error }:any) => {
  return (
    <div className="fixed inset-0 bg-[#fdfaf5] z-[100] flex flex-col items-center justify-center transition-opacity duration-500">
      <div className="w-full max-w-md p-8 text-center">
        {/* Yahan aap apna logo bhi daal sakte hain */}
        <h1 className="text-4xl font-serif text-[#3E2723] mb-4">
          art-humanity
        </h1>
        <p className="text-[#8D6E63] text-lg mb-8">{message}</p>

        {/* Progress Bar */}
        <div className="w-full bg-[#E0E0E0] rounded-full h-4 mb-4 overflow-hidden border border-[#BDBDBD]">
          <div
            className="bg-[#d29000] h-full rounded-full transition-all duration-500 ease-out"
            style={{ width: `${progress}%` }}></div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mt-6 text-red-600 bg-red-100 p-3 rounded-lg">
            <p className="font-bold">Oops! Something went wrong.</p>
            <p className="text-sm">{error}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default InitialLoader;

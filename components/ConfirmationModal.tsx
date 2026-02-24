"use client";

type ConfirmationModalProps = {
  show: boolean;
  title: string;
  message: string;
  buttonText: string;
  onClose: () => void;
};

export function ConfirmationModal({
  show,
  title,
  message,
  buttonText,
  onClose,
}: ConfirmationModalProps) {
  if (!show) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/20 backdrop-blur-sm">
      <div className="relative bg-white rounded-3xl p-8 max-w-sm w-full shadow-2xl shadow-purple-200/30 border border-gray-100 animate-bounce-in">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-500 hover:text-gray-700 transition-colors"
          aria-label="Close"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
        <h3 className="font-display text-xl font-bold gradient-text mb-3 text-center pr-8">
          {title}
        </h3>
        <p className="text-gray-500 mb-6 text-center leading-relaxed">{message}</p>
        <button
          onClick={onClose}
          className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-[#6c5ce7] to-[#a29bfe] text-white font-bold text-lg transition-all duration-300 hover:shadow-lg hover:shadow-purple-300/40 hover:scale-[1.02] active:scale-95"
        >
          {buttonText}
        </button>
      </div>
    </div>
  );
}

import { Component } from "react";
import { AlertTriangle, RefreshCw, RotateCcw } from "lucide-react";

/**
 * ErrorBoundary.jsx
 * Bắt lỗi runtime của các widget con (Bản đồ, Thời tiết, Haptic...),
 * ngăn việc ứng dụng bị sập toàn bộ thành màn hình trắng xóa.
 */
export class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("ErrorBoundary caught an error:", error, errorInfo);
    this.setState({ errorInfo });
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    this.props.onReset?.();
  };

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return typeof this.props.fallback === "function"
          ? this.props.fallback(this.state.error, this.handleReset)
          : this.props.fallback;
      }

      return (
        <div className="card-static my-4 p-5 rounded-3xl bg-gradient-to-br from-rose-50/70 via-white to-pink-50/60 border-2 border-rose-200 shadow-romantic text-stone-800 space-y-3">
          <div className="flex items-center gap-2.5 text-rose-600">
            <div className="w-9 h-9 rounded-2xl bg-rose-100 flex items-center justify-center shrink-0">
              <AlertTriangle className="w-5 h-5 text-rose-500" />
            </div>
            <div>
              <h3 className="font-display font-bold text-sm text-stone-900">
                {this.props.name || "Một tiện ích"} gặp sự cố tải dữ liệu
              </h3>
              <p className="text-xs text-stone-500 font-serif">
                Đừng lo, dữ liệu và lịch hẹn của hai bạn vẫn hoàn toàn an toàn ✨
              </p>
            </div>
          </div>

          {/* Chi tiết lỗi dạng rút gọn */}
          {this.state.error?.message && (
            <div className="bg-stone-50 border border-stone-200/70 rounded-xl p-2.5 text-[11px] text-stone-600 font-mono overflow-x-auto max-h-24">
              {this.state.error.message}
            </div>
          )}

          <div className="flex items-center gap-2 pt-1 flex-wrap">
            <button
              type="button"
              onClick={this.handleReset}
              className="bg-gradient-to-r from-rose-500 to-pink-500 hover:from-rose-600 hover:to-pink-600 text-white font-bold py-2 px-3.5 rounded-xl text-xs flex items-center gap-1.5 shadow-xs transition-all active:scale-95 cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Thử tải lại</span>
            </button>
            <button
              type="button"
              onClick={this.handleReload}
              className="bg-white hover:bg-stone-50 border border-stone-200 text-stone-700 font-medium py-2 px-3.5 rounded-xl text-xs flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5 text-stone-400" />
              <span>Làm mới ứng dụng</span>
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;

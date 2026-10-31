import { useEffect, useRef, useState, type FormEvent } from "react"

type LoginModalProps = {
  onClose: () => void
  onSubmit?: (email: string, password: string) => Promise<void>
}

export default function LoginModal({
  onClose,
  onSubmit,
}: LoginModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    const dialog = dialogRef.current
    const previousFocus = document.activeElement
    const previousOverflow = document.body.style.overflow

    dialog?.showModal()
    document.body.style.overflow = "hidden"

    return () => {
      dialog?.close()
      document.body.style.overflow = previousOverflow
      if (previousFocus instanceof HTMLElement) previousFocus.focus()
    }
  }, [])

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (loading) return

    setError("")

    if (!email.trim() || !password) {
      setError("이메일과 비밀번호를 입력해 주세요.")
      return
    }

    // 백엔드 담당자가 onSubmit을 연결하면 실제 로그인을 실행합니다.
    if (!onSubmit) {
      setError("로그인 API 연결 전입니다. 백엔드 연결 후 사용할 수 있습니다.")
      return
    }

    setLoading(true)

    try {
      await onSubmit(email.trim(), password)
      onClose()
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "로그인하지 못했습니다. 다시 시도해 주세요.",
      )
    } finally {
      setLoading(false)
    }
  }

  const inputClass =
    "mt-2 w-full rounded-lg border border-[#30363d] " +
    "bg-[#0d1117] px-3 py-3 text-sm text-[#e6edf3] " +
    "placeholder:text-[#6B7280] outline-none " +
    "focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 " +
    "disabled:opacity-60"

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby="login-title"
      aria-describedby="login-description"
      onCancel={(event) => {
        event.preventDefault()
        if (!loading) onClose()
      }}
      className="fixed inset-0 m-auto max-h-[90vh] w-[calc(100%-2rem)] max-w-[420px] overflow-y-auto rounded-2xl border border-[#30363d] bg-[#161b22] p-0 text-[#e6edf3] shadow-2xl backdrop:bg-black/70"
    >
      <div className="p-6 sm:p-8">
        <div className="flex items-center justify-between">
          <span className="text-sm font-semibold text-blue-400">
            Track-AI
          </span>

          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            aria-label="로그인 창 닫기"
            className="rounded-md px-2 py-1 text-xl text-[#9CA3AF] hover:bg-[#21262d] hover:text-white disabled:opacity-40"
          >
            ×
          </button>
        </div>

        <h2
          id="login-title"
          className="mt-6 text-2xl font-semibold tracking-tight text-white"
        >
          로그인
        </h2>

        <p
          id="login-description"
          className="mt-2 text-sm leading-6 text-[#9CA3AF]"
        >
          창작 기록과 라이선스를 관리하세요.
        </p>

        <form
          onSubmit={handleSubmit}
          aria-busy={loading}
          className="mt-7 space-y-5"
        >
          <div>
            <label
              htmlFor="login-email"
              className="text-sm font-medium"
            >
              이메일
            </label>
            <input
              id="login-email"
              name="email"
              type="email"
              autoComplete="username"
              autoFocus
              required
              disabled={loading}
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="name@example.com"
              className={inputClass}
            />
          </div>

          <div>
            <label
              htmlFor="login-password"
              className="text-sm font-medium"
            >
              비밀번호
            </label>

            <div className="relative">
              <input
                id="login-password"
                name="password"
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                required
                disabled={loading}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="비밀번호를 입력하세요"
                className={`${inputClass} pr-16`}
              />

              <button
                type="button"
                disabled={loading}
                aria-controls="login-password"
                aria-pressed={showPassword}
                onClick={() => setShowPassword((value) => !value)}
                className="absolute right-3 top-1/2 -translate-y-1/2 pt-2 text-xs text-[#9CA3AF] hover:text-white"
              >
                {showPassword ? "숨기기" : "보기"}
              </button>
            </div>
          </div>

          {error && (
            <p
              role="alert"
              className="rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-3 text-sm leading-5 text-red-300"
            >
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-blue-500 px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-blue-600 disabled:cursor-wait disabled:opacity-60"
          >
            {loading ? "로그인 중…" : "로그인"}
          </button>
        </form>

        <p className="mt-6 border-t border-[#30363d] pt-5 text-xs leading-5 text-[#9CA3AF]">
          음원 등록과 구매를 위한 지갑 연결은 로그인 후 별도로 진행합니다.
        </p>
      </div>
    </dialog>
  )
}
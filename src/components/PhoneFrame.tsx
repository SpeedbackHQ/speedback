interface PhoneFrameProps {
  children: React.ReactNode
}

export function PhoneFrame({ children }: PhoneFrameProps) {
  return (
    <div className="flex justify-center">
      {/* Phone shell */}
      <div
        className="relative bg-gray-900 rounded-[3rem] p-3 shadow-2xl"
        style={{ width: 375 + 24, height: 812 + 24 }}
      >
        {/* Dynamic island */}
        <div className="absolute top-4 left-1/2 -translate-x-1/2 w-28 h-7 bg-black rounded-full z-30" />

        {/* Screen */}
        <div
          className="relative w-[375px] h-[812px] rounded-[2.2rem] overflow-hidden bg-slate-50"
        >
          {/* Screen content */}
          <div className="w-full h-full overflow-y-auto overflow-x-hidden">
            {children}
          </div>
        </div>
      </div>
    </div>
  )
}

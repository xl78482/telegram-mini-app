import { Sidebar } from '@/components/sidebar'

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-[#0a0a0a]">
      <Sidebar />
      {/* PC 端 main 左边距匹配 sidebar 宽度；手机端占满屏并加顶部 offset */}
      <main className="flex-1 md:ml-56 ml-0 p-4 md:p-6 mt-12 md:mt-0 min-w-0">
        {children}
      </main>
    </div>
  )
}

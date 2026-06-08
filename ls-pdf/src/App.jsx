function App() {
  return (
    <div className="min-h-screen bg-surface p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold text-primary mb-4">LS PDF</h1>
        <div className="bg-primary text-white p-4 rounded-lg">
          Tailwind CSS is working! (Using Custom Primary Color)
        </div>
        <div className="bg-red-500 text-white p-4 rounded-lg mt-4">
          Test: bg-red-500 is applying correctly!
        </div>
        <div className="mt-4 p-4 bg-surface border border-muted/20 rounded-lg">
          <p className="text-text">All dependencies installed and configured.</p>
        </div>
      </div>
    </div>
  )
}

export default App
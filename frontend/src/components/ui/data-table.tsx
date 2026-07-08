'use client'

interface Column<T> {
  header: string
  accessor: (item: T) => React.ReactNode
  className?: string
}

interface DataTableProps<T> {
  columns: Column<T>[]
  data: T[]
  loading?: boolean
  error?: string
  emptyMessage?: string
  keyExtractor: (item: T) => string
}

export function DataTable<T>({ columns, data, loading, error, emptyMessage = 'No data found', keyExtractor }: DataTableProps<T>) {
  if (loading) {
    return (
      <div className="rounded-lg border">
        <div className="p-8 text-center text-muted-foreground">
          <div className="animate-spin rounded-full h-6 w-6 border-2 border-primary border-t-transparent mx-auto mb-2" />
          Loading...
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="rounded-lg border border-destructive/20 bg-destructive/5 p-8 text-center text-destructive">
        {error}
      </div>
    )
  }

  if (data.length === 0) {
    return (
      <div className="rounded-lg border p-8 text-center text-muted-foreground">
        {emptyMessage}
      </div>
    )
  }

  return (
    <div className="rounded-lg border overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b bg-muted/50">
            {columns.map((col, i) => (
              <th key={i} className={`px-4 py-3 text-left text-sm font-medium text-muted-foreground ${col.className || ''}`}>
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((item) => (
            <tr key={keyExtractor(item)} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
              {columns.map((col, i) => (
                <td key={i} className={`px-4 py-3 text-sm ${col.className || ''}`}>
                  {col.accessor(item)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

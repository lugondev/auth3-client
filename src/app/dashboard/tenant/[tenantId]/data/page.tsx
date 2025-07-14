'use client'

import React from 'react'
import { useParams } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { 
  Database, 
  HardDrive,
  Upload,
  Download,
  Trash2,
  File,
  Folder,
  Search
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

export default function TenantDataPage() {
  const params = useParams()
  const tenantId = params.tenantId as string

  const storageStats = [
    {
      title: 'Total Storage',
      value: '2.4 GB',
      usage: '45%',
      icon: HardDrive,
    },
    {
      title: 'Files',
      value: '1,234',
      change: '+56',
      icon: File,
    },
    {
      title: 'Folders',
      value: '89',
      change: '+12',
      icon: Folder,
    },
    {
      title: 'Shared Items',
      value: '156',
      change: '+23',
      icon: Database,
    },
  ]

  const recentFiles = [
    {
      name: 'Q1_Report_2024.pdf',
      size: '2.4 MB',
      modified: '2 hours ago',
      type: 'PDF'
    },
    {
      name: 'UserData_Export.csv',
      size: '856 KB',
      modified: '5 hours ago',
      type: 'CSV'
    },
    {
      name: 'TenantConfig.json',
      size: '12 KB',
      modified: '1 day ago',
      type: 'JSON'
    },
    {
      name: 'BackupData_March.zip',
      size: '45.2 MB',
      modified: '2 days ago',
      type: 'ZIP'
    }
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Data Management</h1>
          <p className="text-muted-foreground">
            Manage your tenant data and storage
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export Data
          </Button>
          <Button>
            <Upload className="h-4 w-4 mr-2" />
            Upload Files
          </Button>
        </div>
      </div>

      {/* Search */}
      <div className="flex items-center space-x-2">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search files and folders..." className="pl-8" />
        </div>
      </div>

      {/* Storage Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {storageStats.map((stat) => (
          <Card key={stat.title}>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    {stat.title}
                  </p>
                  <p className="text-2xl font-bold">{stat.value}</p>
                  {stat.usage && (
                    <p className="text-xs text-muted-foreground">
                      {stat.usage} used
                    </p>
                  )}
                  {stat.change && (
                    <p className="text-xs text-green-600">
                      {stat.change} this month
                    </p>
                  )}
                </div>
                <div className="p-3 bg-blue-100 dark:bg-blue-900 rounded-full">
                  <stat.icon className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Recent Files */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Files</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {recentFiles.map((file, index) => (
              <div key={index} className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50">
                <div className="flex items-center space-x-4">
                  <div className="p-2 bg-gray-100 dark:bg-gray-800 rounded">
                    <File className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="font-medium">{file.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {file.size} • Modified {file.modified}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-xs bg-muted px-2 py-1 rounded">
                    {file.type}
                  </span>
                  <Button variant="ghost" size="sm">
                    <Download className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="sm">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button variant="outline" className="h-20 flex flex-col items-center space-y-2">
              <Upload className="h-6 w-6" />
              <span>Upload Files</span>
            </Button>
            <Button variant="outline" className="h-20 flex flex-col items-center space-y-2">
              <Folder className="h-6 w-6" />
              <span>Create Folder</span>
            </Button>
            <Button variant="outline" className="h-20 flex flex-col items-center space-y-2">
              <Download className="h-6 w-6" />
              <span>Bulk Export</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

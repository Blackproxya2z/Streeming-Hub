'use client'

import { useState, useEffect } from 'react'
import { useAppStore } from '@/lib/store'
import { useProducts, useCategories, useReviews, useSettings } from '@/lib/hooks'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Separator } from '@/components/ui/separator'
import {
  ArrowLeft,
  Plus,
  Trash2,
  Edit,
  Lock,
  Package,
  FolderOpen,
  Star,
  Settings,
  ShoppingBag,
  ImageIcon,
} from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'

export function AdminPanel() {
  const { navigate } = useAppStore()
  const { data: settings } = useSettings()
  const [authenticated, setAuthenticated] = useState(false)
  const [password, setPassword] = useState('')
  const [loginError, setLoginError] = useState(false)

  const handleLogin = () => {
    const adminPassword = settings?.adminPassword || 'admin123'
    if (password === adminPassword) {
      setAuthenticated(true)
      setLoginError(false)
    } else {
      setLoginError(true)
    }
  }

  if (!authenticated) {
    return (
      <section className="py-16 px-4">
        <div className="container mx-auto max-w-sm">
          <Card>
            <CardContent className="p-6 text-center space-y-4">
              <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mx-auto">
                <Lock className="h-8 w-8 text-muted-foreground" />
              </div>
              <h2 className="text-xl font-bold">Admin Login</h2>
              <div className="space-y-3">
                <Input
                  type="password"
                  placeholder="Enter admin password"
                  value={password}
                  onChange={e => { setPassword(e.target.value); setLoginError(false) }}
                  onKeyDown={e => e.key === 'Enter' && handleLogin()}
                />
                {loginError && (
                  <p className="text-sm text-red-500">Incorrect password</p>
                )}
                <Button onClick={handleLogin} className="w-full bg-emerald-600 hover:bg-emerald-700">
                  Login
                </Button>
              </div>
              <Button variant="ghost" size="sm" onClick={() => navigate('home')}>
                <ArrowLeft className="h-4 w-4 mr-2" /> Back to Home
              </Button>
            </CardContent>
          </Card>
        </div>
      </section>
    )
  }

  return (
    <section className="py-8 px-4">
      <div className="container mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold">Admin Panel</h1>
            <p className="text-muted-foreground text-sm">Manage your store</p>
          </div>
          <Button variant="outline" size="sm" onClick={() => setAuthenticated(false)}>
            Logout
          </Button>
        </div>

        <Tabs defaultValue="products" className="space-y-6">
          <TabsList className="flex-wrap h-auto gap-1">
            <TabsTrigger value="products" className="text-xs sm:text-sm">
              <Package className="h-4 w-4 mr-1" /> Products
            </TabsTrigger>
            <TabsTrigger value="categories" className="text-xs sm:text-sm">
              <FolderOpen className="h-4 w-4 mr-1" /> Categories
            </TabsTrigger>
            <TabsTrigger value="reviews" className="text-xs sm:text-sm">
              <Star className="h-4 w-4 mr-1" /> Reviews
            </TabsTrigger>
            <TabsTrigger value="orders" className="text-xs sm:text-sm">
              <ShoppingBag className="h-4 w-4 mr-1" /> Orders
            </TabsTrigger>
            <TabsTrigger value="settings" className="text-xs sm:text-sm">
              <Settings className="h-4 w-4 mr-1" /> Settings
            </TabsTrigger>
            <TabsTrigger value="banners" className="text-xs sm:text-sm">
              <ImageIcon className="h-4 w-4 mr-1" /> Banners
            </TabsTrigger>
          </TabsList>

          <TabsContent value="products"><ProductsTab /></TabsContent>
          <TabsContent value="categories"><CategoriesTab /></TabsContent>
          <TabsContent value="reviews"><ReviewsTab /></TabsContent>
          <TabsContent value="orders"><OrdersTab /></TabsContent>
          <TabsContent value="settings"><SettingsTab /></TabsContent>
          <TabsContent value="banners"><BannersTab /></TabsContent>
        </Tabs>
      </div>
    </section>
  )
}

function ProductsTab() {
  const { data, isLoading } = useProducts({ isAdult: 'true' })
  const { data: nonAdultData } = useProducts({})
  const { data: categories } = useCategories()
  const [editing, setEditing] = useState<any>(null)
  const [open, setOpen] = useState(false)
  const [refreshKey, setRefreshKey] = useState(0)

  const products = [...(nonAdultData?.products || []), ...(data?.products || [])]
  // Deduplicate by id
  const uniqueProducts = Array.from(new Map(products.map(p => [p.id, p])).values())

  const [form, setForm] = useState({
    name: '', slug: '', description: '', categoryId: '', basePriceBDT: 'Inbox Price',
    duration: '', accountType: '', region: '', warranty: '', deliveryTime: '5-20 minutes',
    stockStatus: 'Available', features: '[]', priceOptions: '[]',
    isFeatured: false, isBestSeller: false, isNewArrival: false, order: 0,
  })

  const resetForm = () => {
    setForm({
      name: '', slug: '', description: '', categoryId: '', basePriceBDT: 'Inbox Price',
      duration: '', accountType: '', region: '', warranty: '', deliveryTime: '5-20 minutes',
      stockStatus: 'Available', features: '[]', priceOptions: '[]',
      isFeatured: false, isBestSeller: false, isNewArrival: false, order: 0,
    })
    setEditing(null)
  }

  const handleEdit = (product: any) => {
    setEditing(product)
    setForm({
      name: product.name, slug: product.slug, description: product.description,
      categoryId: product.categoryId, basePriceBDT: product.basePriceBDT,
      duration: product.duration || '', accountType: product.accountType || '',
      region: product.region || '', warranty: product.warranty || '',
      deliveryTime: product.deliveryTime, stockStatus: product.stockStatus,
      features: product.features, priceOptions: product.priceOptions,
      isFeatured: product.isFeatured, isBestSeller: product.isBestSeller,
      isNewArrival: product.isNewArrival, order: product.order,
    })
    setOpen(true)
  }

  const handleSave = async () => {
    const payload = {
      ...form,
      slug: form.slug || form.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''),
    }
    if (editing) {
      await fetch(`/api/products/${editing.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
    } else {
      await fetch('/api/products', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
    }
    setOpen(false)
    resetForm()
    setRefreshKey(k => k + 1)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this product?')) return
    await fetch(`/api/products/${id}`, { method: 'DELETE' })
    setRefreshKey(k => k + 1)
  }

  if (isLoading) return <Skeleton className="h-64 rounded-xl" />

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between">
        <CardTitle>Products ({uniqueProducts.length})</CardTitle>
        <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) resetForm() }}>
          <DialogTrigger asChild>
            <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700">
              <Plus className="h-4 w-4 mr-1" /> Add Product
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editing ? 'Edit Product' : 'Add Product'}</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div><Label>Name</Label><Input value={form.name} onChange={e => setForm({...form, name: e.target.value})} /></div>
                <div><Label>Slug</Label><Input value={form.slug} onChange={e => setForm({...form, slug: e.target.value})} placeholder="Auto-generated" /></div>
              </div>
              <div><Label>Description</Label><Textarea value={form.description} onChange={e => setForm({...form, description: e.target.value})} rows={2} /></div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Category</Label>
                  <Select value={form.categoryId} onValueChange={v => setForm({...form, categoryId: v})}>
                    <SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
                    <SelectContent>
                      {(categories || []).map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div><Label>Base Price BDT</Label><Input value={form.basePriceBDT} onChange={e => setForm({...form, basePriceBDT: e.target.value})} /></div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div><Label>Duration</Label><Input value={form.duration} onChange={e => setForm({...form, duration: e.target.value})} placeholder="e.g. 1 year" /></div>
                <div><Label>Account Type</Label><Input value={form.accountType} onChange={e => setForm({...form, accountType: e.target.value})} placeholder="e.g. Personal" /></div>
                <div><Label>Region</Label><Input value={form.region} onChange={e => setForm({...form, region: e.target.value})} placeholder="e.g. Global" /></div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div><Label>Warranty</Label><Input value={form.warranty} onChange={e => setForm({...form, warranty: e.target.value})} placeholder="e.g. 1 month" /></div>
                <div><Label>Delivery Time</Label><Input value={form.deliveryTime} onChange={e => setForm({...form, deliveryTime: e.target.value})} /></div>
                <div>
                  <Label>Stock Status</Label>
                  <Select value={form.stockStatus} onValueChange={v => setForm({...form, stockStatus: v})}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Available">Available</SelectItem>
                      <SelectItem value="Limited Stock">Limited Stock</SelectItem>
                      <SelectItem value="Out of Stock">Out of Stock</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div><Label>Features (JSON array)</Label><Textarea value={form.features} onChange={e => setForm({...form, features: e.target.value})} rows={2} /></div>
              <div><Label>Price Options (JSON array)</Label><Textarea value={form.priceOptions} onChange={e => setForm({...form, priceOptions: e.target.value})} rows={2} /></div>
              <div className="grid grid-cols-3 gap-4">
                <label className="flex items-center gap-2"><input type="checkbox" checked={form.isFeatured} onChange={e => setForm({...form, isFeatured: e.target.checked})} /> Featured</label>
                <label className="flex items-center gap-2"><input type="checkbox" checked={form.isBestSeller} onChange={e => setForm({...form, isBestSeller: e.target.checked})} /> Best Seller</label>
                <label className="flex items-center gap-2"><input type="checkbox" checked={form.isNewArrival} onChange={e => setForm({...form, isNewArrival: e.target.checked})} /> New Arrival</label>
              </div>
              <div><Label>Order</Label><Input type="number" value={form.order} onChange={e => setForm({...form, order: parseInt(e.target.value) || 0})} /></div>
              <Button onClick={handleSave} className="bg-emerald-600 hover:bg-emerald-700">
                {editing ? 'Update Product' : 'Create Product'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Price</TableHead>
                <TableHead>Stock</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {uniqueProducts.map(p => (
                <TableRow key={p.id}>
                  <TableCell className="font-medium max-w-48 truncate">{p.name}</TableCell>
                  <TableCell><Badge variant="secondary" className="text-xs">{p.category?.name}</Badge></TableCell>
                  <TableCell>{p.basePriceBDT}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className="text-xs">{p.stockStatus}</Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button size="icon" variant="ghost" onClick={() => handleEdit(p)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button size="icon" variant="ghost" onClick={() => handleDelete(p.id)}>
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  )
}

function CategoriesTab() {
  const { data: categories, isLoading } = useCategories()
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<any>(null)
  const [form, setForm] = useState({ name: '', slug: '', icon: '', description: '', isAdult: false, order: 0 })

  const resetForm = () => { setForm({ name: '', slug: '', icon: '', description: '', isAdult: false, order: 0 }); setEditing(null) }

  const handleEdit = (cat: any) => {
    setEditing(cat)
    setForm({ name: cat.name, slug: cat.slug, icon: cat.icon || '', description: cat.description || '', isAdult: cat.isAdult, order: cat.order })
    setOpen(true)
  }

  const handleSave = async () => {
    const payload = { ...form, slug: form.slug || form.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') }
    if (editing) {
      await fetch(`/api/categories/${editing.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
    } else {
      await fetch('/api/categories', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
    }
    setOpen(false)
    resetForm()
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this category and all its products?')) return
    await fetch(`/api/categories/${id}`, { method: 'DELETE' })
  }

  if (isLoading) return <Skeleton className="h-64 rounded-xl" />

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between">
        <CardTitle>Categories ({(categories || []).length})</CardTitle>
        <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) resetForm() }}>
          <DialogTrigger asChild>
            <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700"><Plus className="h-4 w-4 mr-1" /> Add</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>{editing ? 'Edit Category' : 'Add Category'}</DialogTitle></DialogHeader>
            <div className="grid gap-4 py-4">
              <div><Label>Name</Label><Input value={form.name} onChange={e => setForm({...form, name: e.target.value})} /></div>
              <div><Label>Slug</Label><Input value={form.slug} onChange={e => setForm({...form, slug: e.target.value})} placeholder="Auto-generated" /></div>
              <div><Label>Icon</Label><Input value={form.icon} onChange={e => setForm({...form, icon: e.target.value})} placeholder="e.g. streaming" /></div>
              <div><Label>Description</Label><Textarea value={form.description} onChange={e => setForm({...form, description: e.target.value})} rows={2} /></div>
              <label className="flex items-center gap-2"><input type="checkbox" checked={form.isAdult} onChange={e => setForm({...form, isAdult: e.target.checked})} /> Adult Category</label>
              <div><Label>Order</Label><Input type="number" value={form.order} onChange={e => setForm({...form, order: parseInt(e.target.value) || 0})} /></div>
              <Button onClick={handleSave} className="bg-emerald-600 hover:bg-emerald-700">{editing ? 'Update' : 'Create'}</Button>
            </div>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Slug</TableHead>
                <TableHead>Products</TableHead>
                <TableHead>Adult</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(categories || []).map(c => (
                <TableRow key={c.id}>
                  <TableCell className="font-medium">{c.name}</TableCell>
                  <TableCell>{c.slug}</TableCell>
                  <TableCell>{c._count?.products || 0}</TableCell>
                  <TableCell>{c.isAdult && <Badge variant="destructive" className="text-xs">18+</Badge>}</TableCell>
                  <TableCell className="text-right">
                    <Button size="icon" variant="ghost" onClick={() => handleEdit(c)}><Edit className="h-4 w-4" /></Button>
                    <Button size="icon" variant="ghost" onClick={() => handleDelete(c.id)}><Trash2 className="h-4 w-4 text-red-500" /></Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  )
}

function ReviewsTab() {
  const { data: reviews, isLoading } = useReviews()
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState({ name: '', rating: 5, text: '', product: '' })

  const handleSave = async () => {
    await fetch('/api/reviews', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) })
    setOpen(false)
    setForm({ name: '', rating: 5, text: '', product: '' })
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this review?')) return
    await fetch(`/api/reviews/${id}`, { method: 'DELETE' })
  }

  if (isLoading) return <Skeleton className="h-64 rounded-xl" />

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between">
        <CardTitle>Reviews ({(reviews || []).length})</CardTitle>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700"><Plus className="h-4 w-4 mr-1" /> Add</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Add Review</DialogTitle></DialogHeader>
            <div className="grid gap-4 py-4">
              <div><Label>Name</Label><Input value={form.name} onChange={e => setForm({...form, name: e.target.value})} /></div>
              <div><Label>Rating</Label><Input type="number" min={1} max={5} value={form.rating} onChange={e => setForm({...form, rating: parseInt(e.target.value) || 5})} /></div>
              <div><Label>Review Text</Label><Textarea value={form.text} onChange={e => setForm({...form, text: e.target.value})} rows={3} /></div>
              <div><Label>Product</Label><Input value={form.product} onChange={e => setForm({...form, product: e.target.value})} /></div>
              <Button onClick={handleSave} className="bg-emerald-600 hover:bg-emerald-700">Create Review</Button>
            </div>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Rating</TableHead>
                <TableHead>Review</TableHead>
                <TableHead>Product</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(reviews || []).map(r => (
                <TableRow key={r.id}>
                  <TableCell className="font-medium">{r.name}</TableCell>
                  <TableCell>{'★'.repeat(r.rating)}</TableCell>
                  <TableCell className="max-w-48 truncate">{r.text}</TableCell>
                  <TableCell>{r.product || '-'}</TableCell>
                  <TableCell className="text-right">
                    <Button size="icon" variant="ghost" onClick={() => handleDelete(r.id)}><Trash2 className="h-4 w-4 text-red-500" /></Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  )
}

function OrdersTab() {
  const [orders, setOrders] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/orders').then(r => r.json()).then(d => { setOrders(d); setLoading(false) }).catch(() => setLoading(false))
  }, [])

  if (loading) return <Skeleton className="h-64 rounded-xl" />

  return (
    <Card>
      <CardHeader><CardTitle>Orders ({orders.length})</CardTitle></CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Product</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>WhatsApp</TableHead>
                <TableHead>Payment</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {orders.map(o => (
                <TableRow key={o.id}>
                  <TableCell className="font-medium max-w-32 truncate">{o.productName}</TableCell>
                  <TableCell>{o.customerName}</TableCell>
                  <TableCell>{o.whatsappNumber}</TableCell>
                  <TableCell>{o.paymentMethod || '-'}</TableCell>
                  <TableCell><Badge variant="outline" className="text-xs">{o.status}</Badge></TableCell>
                  <TableCell className="text-xs text-muted-foreground">{new Date(o.createdAt).toLocaleDateString()}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  )
}

function SettingsTab() {
  const { data: settings, isLoading } = useSettings()
  const [localEdits, setLocalEdits] = useState<Record<string, string>>({})

  const getValue = (key: string) => localEdits[key] ?? settings?.[key] ?? ''

  const handleChange = (key: string, value: string) => {
    setLocalEdits(prev => ({ ...prev, [key]: value }))
  }

  const handleSave = async () => {
    const payload = { ...settings, ...localEdits }
    await fetch('/api/settings', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
    setLocalEdits({})
    alert('Settings saved!')
  }

  if (isLoading) return <Skeleton className="h-64 rounded-xl" />

  return (
    <Card>
      <CardHeader><CardTitle>Settings</CardTitle></CardHeader>
      <CardContent className="space-y-4">
        <div><Label>WhatsApp Number</Label><Input value={getValue('whatsappNumber')} onChange={e => handleChange('whatsappNumber', e.target.value)} /></div>
        <div><Label>Payment Number</Label><Input value={getValue('paymentNumber')} onChange={e => handleChange('paymentNumber', e.target.value)} /></div>
        <div><Label>Exchange Rate (BDT to RMB)</Label><Input value={getValue('exchangeRate')} onChange={e => handleChange('exchangeRate', e.target.value)} /></div>
        <div><Label>Admin Password</Label><Input type="password" value={getValue('adminPassword')} onChange={e => handleChange('adminPassword', e.target.value)} /></div>
        <div><Label>bKash Number</Label><Input value={getValue('bkashNumber')} onChange={e => handleChange('bkashNumber', e.target.value)} /></div>
        <div><Label>Nagad Number</Label><Input value={getValue('nagadNumber')} onChange={e => handleChange('nagadNumber', e.target.value)} /></div>
        <Button onClick={handleSave} className="bg-emerald-600 hover:bg-emerald-700">Save Settings</Button>
      </CardContent>
    </Card>
  )
}

function BannersTab() {
  const [banners, setBanners] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState({ text: '', isActive: true })

  useEffect(() => {
    fetch('/api/banners').then(r => r.json()).then(d => { setBanners(d); setLoading(false) }).catch(() => setLoading(false))
  }, [])

  const handleSave = async () => {
    await fetch('/api/banners', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) })
    setOpen(false)
    setForm({ text: '', isActive: true })
    const res = await fetch('/api/banners')
    setBanners(await res.json())
  }

  if (loading) return <Skeleton className="h-64 rounded-xl" />

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between">
        <CardTitle>Banners ({banners.length})</CardTitle>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700"><Plus className="h-4 w-4 mr-1" /> Add</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Add Banner</DialogTitle></DialogHeader>
            <div className="grid gap-4 py-4">
              <div><Label>Text</Label><Input value={form.text} onChange={e => setForm({...form, text: e.target.value})} /></div>
              <label className="flex items-center gap-2"><input type="checkbox" checked={form.isActive} onChange={e => setForm({...form, isActive: e.target.checked})} /> Active</label>
              <Button onClick={handleSave} className="bg-emerald-600 hover:bg-emerald-700">Create Banner</Button>
            </div>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Text</TableHead>
                <TableHead>Active</TableHead>
                <TableHead>Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {banners.map(b => (
                <TableRow key={b.id}>
                  <TableCell>{b.text}</TableCell>
                  <TableCell>{b.isActive ? <Badge className="bg-emerald-500 text-xs">Active</Badge> : <Badge variant="secondary" className="text-xs">Inactive</Badge>}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">{new Date(b.createdAt).toLocaleDateString()}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  )
}

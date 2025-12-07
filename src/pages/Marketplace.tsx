import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { Store, ShoppingBag, Briefcase, Home, Search, Plus, MapPin, Phone, MessageCircle, Heart, TrendingUp, Star } from 'lucide-react';

export default function Marketplace() {
  const [activeTab, setActiveTab] = useState('buy-sell');
  const [searchQuery, setSearchQuery] = useState('');
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('All');

  const listings = [
    { id: 1, title: 'iPhone 14 Pro', price: 'Rs. 180,000', location: 'Tulsipur', category: 'Electronics', image: '📱', seller: 'Ram B.', phone: '+977-9800000001', verified: true },
    { id: 2, title: 'Honda Shine 125cc', price: 'Rs. 95,000', location: 'Dang', category: 'Vehicles', image: '🏍️', seller: 'Shyam K.', phone: '+977-9800000002', verified: true },
    { id: 3, title: 'Laptop Dell XPS', price: 'Rs. 250,000', location: 'Urahari', category: 'Electronics', image: '💻', seller: 'Hari P.', phone: '+977-9800000003', verified: false },
    { id: 4, title: 'Study Table', price: 'Rs. 8,500', location: 'Tulsipur', category: 'Furniture', image: '🪑', seller: 'Gita M.', phone: '+977-9800000004', verified: true },
    { id: 5, title: 'DSLR Camera', price: 'Rs. 85,000', location: 'Dang', category: 'Electronics', image: '📷', seller: 'Amit S.', phone: '+977-9800000005', verified: true },
    { id: 6, title: 'Mountain Bike', price: 'Rs. 35,000', location: 'Urahari', category: 'Sports', image: '🚴', seller: 'Sita R.', phone: '+977-9800000006', verified: false },
  ];

  const jobs = [
    { id: 1, title: 'Web Developer', company: 'Tech Solutions', location: 'Tulsipur', type: 'Full-time', salary: 'Rs. 50,000/mo', contact: '+977-9800000010' },
    { id: 2, title: 'Graphic Designer', company: 'Creative Studio', location: 'Dang', type: 'Part-time', salary: 'Rs. 25,000/mo', contact: '+977-9800000011' },
    { id: 3, title: 'Teacher (Math)', company: 'ABC School', location: 'Urahari', type: 'Full-time', salary: 'Rs. 30,000/mo', contact: '+977-9800000012' },
  ];

  const rentals = [
    { id: 1, title: '2BHK Apartment', price: 'Rs. 15,000/mo', location: 'Tulsipur', type: 'Apartment', image: '🏠', contact: '+977-9800000020' },
    { id: 2, title: 'Shop Space', price: 'Rs. 25,000/mo', location: 'Dang', type: 'Commercial', image: '🏪', contact: '+977-9800000021' },
    { id: 3, title: 'Single Room', price: 'Rs. 5,000/mo', location: 'Urahari', type: 'Room', image: '🛏️', contact: '+977-9800000022' },
  ];

  const businesses = [
    { id: 1, name: 'Himalayan Restaurant', category: 'Food', rating: 4.5, location: 'Tulsipur', image: '🍽️', phone: '+977-9800000030' },
    { id: 2, name: 'Tech Repair Shop', category: 'Services', rating: 4.8, location: 'Dang', image: '🔧', phone: '+977-9800000031' },
    { id: 3, name: 'Fashion Store', category: 'Clothing', rating: 4.2, location: 'Urahari', image: '👗', phone: '+977-9800000032' },
    { id: 4, name: 'Fitness Gym', category: 'Health', rating: 4.6, location: 'Tulsipur', image: '💪', phone: '+977-9800000033' },
  ];

  const categories = ['All', 'Electronics', 'Vehicles', 'Furniture', 'Sports', 'Clothing'];

  const filteredListings = listings.filter(item => 
    (selectedCategory === 'All' || item.category === selectedCategory) &&
    (item.title.toLowerCase().includes(searchQuery.toLowerCase()) || item.category.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const handleContact = (phone: string, name: string) => {
    toast.success(`Calling ${name}...`);
    window.open(`tel:${phone}`);
  };

  const handleMessage = (name: string) => {
    toast.info(`Opening chat with ${name}...`);
  };

  return (
    <div className="space-y-4 pb-20">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <h1 className="text-xl sm:text-2xl font-bold flex items-center gap-2">🛒 Marketplace</h1>
        <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="gap-2 btn-cosmic w-full sm:w-auto">
              <Plus className="w-4 h-4" />Post Listing
            </Button>
          </DialogTrigger>
          <DialogContent className="glass-card max-w-md mx-4">
            <DialogHeader><DialogTitle>Create Listing</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div><Label className="text-xs">Title</Label><Input placeholder="What are you selling?" className="glass-card" /></div>
              <div><Label className="text-xs">Category</Label>
                <Select><SelectTrigger className="glass-card"><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>
                    {categories.filter(c => c !== 'All').map(cat => <SelectItem key={cat} value={cat.toLowerCase()}>{cat}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label className="text-xs">Price (Rs.)</Label><Input type="number" placeholder="0" className="glass-card" /></div>
                <div><Label className="text-xs">Location</Label><Input placeholder="City" className="glass-card" /></div>
              </div>
              <div><Label className="text-xs">Phone</Label><Input placeholder="+977-98..." className="glass-card" /></div>
              <div><Label className="text-xs">Description</Label><Textarea placeholder="Details..." className="glass-card" rows={2} /></div>
              <div><Label className="text-xs">Photos</Label><Input type="file" accept="image/*" multiple className="glass-card" /></div>
              <Button className="w-full" onClick={() => { toast.success('Listing created!'); setCreateDialogOpen(false); }}>Post</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input placeholder="Search..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-9 glass-card" />
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="glass-card w-full grid grid-cols-4 h-auto p-1">
          <TabsTrigger value="buy-sell" className="gap-1 text-xs py-2"><ShoppingBag className="w-3.5 h-3.5" /><span className="hidden sm:inline">Buy/Sell</span></TabsTrigger>
          <TabsTrigger value="jobs" className="gap-1 text-xs py-2"><Briefcase className="w-3.5 h-3.5" />Jobs</TabsTrigger>
          <TabsTrigger value="rentals" className="gap-1 text-xs py-2"><Home className="w-3.5 h-3.5" />Rent</TabsTrigger>
          <TabsTrigger value="business" className="gap-1 text-xs py-2"><Store className="w-3.5 h-3.5" /><span className="hidden sm:inline">Local</span></TabsTrigger>
        </TabsList>

        <TabsContent value="buy-sell" className="space-y-4 mt-4">
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
            {categories.map((cat) => (
              <Button key={cat} variant={selectedCategory === cat ? 'default' : 'outline'} size="sm" 
                className="rounded-full text-xs shrink-0" onClick={() => setSelectedCategory(cat)}>{cat}</Button>
            ))}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {filteredListings.map((item) => (
              <Card key={item.id} className="glass-card hover-lift">
                <CardContent className="p-3">
                  <div className="flex gap-3">
                    <div className="text-3xl shrink-0">{item.image}</div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="font-medium text-sm truncate">{item.title}</h3>
                        {item.verified && <Badge className="bg-green-500 text-[9px] shrink-0">✓</Badge>}
                      </div>
                      <p className="text-base font-bold text-primary">{item.price}</p>
                      <p className="text-[10px] text-muted-foreground flex items-center gap-1">
                        <MapPin className="w-3 h-3" />{item.location} • {item.seller}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2 mt-3">
                    <Button size="sm" className="flex-1 h-8 text-xs" onClick={() => handleContact(item.phone, item.seller)}>
                      <Phone className="w-3 h-3 mr-1" />Call
                    </Button>
                    <Button size="sm" variant="outline" className="flex-1 h-8 text-xs" onClick={() => handleMessage(item.seller)}>
                      <MessageCircle className="w-3 h-3 mr-1" />Chat
                    </Button>
                    <Button size="icon" variant="ghost" className="h-8 w-8 shrink-0"><Heart className="w-3.5 h-3.5" /></Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="jobs" className="space-y-3 mt-4">
          {jobs.map((job) => (
            <Card key={job.id} className="glass-card hover-lift">
              <CardContent className="p-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <h3 className="font-medium text-sm">{job.title}</h3>
                    <p className="text-xs text-muted-foreground">{job.company}</p>
                  </div>
                  <Badge variant="outline" className="text-[10px] shrink-0">{job.type}</Badge>
                </div>
                <div className="flex items-center gap-3 mt-2 text-xs">
                  <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{job.location}</span>
                  <span className="font-medium text-primary flex items-center gap-1"><TrendingUp className="w-3 h-3" />{job.salary}</span>
                </div>
                <div className="flex gap-2 mt-3">
                  <Button size="sm" className="flex-1 h-8 text-xs" onClick={() => handleContact(job.contact, job.company)}>
                    <Phone className="w-3 h-3 mr-1" />Apply
                  </Button>
                  <Button size="sm" variant="outline" className="flex-1 h-8 text-xs">View Details</Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="rentals" className="mt-4">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {rentals.map((rental) => (
              <Card key={rental.id} className="glass-card hover-lift">
                <CardContent className="p-3 text-center">
                  <div className="text-3xl mb-2">{rental.image}</div>
                  <h3 className="font-medium text-xs truncate">{rental.title}</h3>
                  <p className="text-sm font-bold text-primary">{rental.price}</p>
                  <p className="text-[10px] text-muted-foreground flex items-center justify-center gap-1">
                    <MapPin className="w-2.5 h-2.5" />{rental.location}
                  </p>
                  <Button size="sm" className="w-full mt-2 h-7 text-xs" onClick={() => handleContact(rental.contact, rental.title)}>
                    <Phone className="w-3 h-3 mr-1" />Contact
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="business" className="space-y-3 mt-4">
          {businesses.map((biz) => (
            <Card key={biz.id} className="glass-card hover-lift">
              <CardContent className="p-3">
                <div className="flex items-center gap-3">
                  <div className="text-3xl shrink-0">{biz.image}</div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-sm">{biz.name}</h3>
                    <p className="text-xs text-muted-foreground">{biz.category}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs flex items-center gap-1"><MapPin className="w-3 h-3" />{biz.location}</span>
                      <span className="text-xs flex items-center gap-1"><Star className="w-3 h-3 text-yellow-500" />{biz.rating}</span>
                    </div>
                  </div>
                </div>
                <div className="flex gap-2 mt-3">
                  <Button size="sm" className="flex-1 h-8 text-xs" onClick={() => handleContact(biz.phone, biz.name)}>
                    <Phone className="w-3 h-3 mr-1" />Call
                  </Button>
                  <Button size="sm" variant="outline" className="flex-1 h-8 text-xs">
                    <MapPin className="w-3 h-3 mr-1" />Directions
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>
      </Tabs>
    </div>
  );
}

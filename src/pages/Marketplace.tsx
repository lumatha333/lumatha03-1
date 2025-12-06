import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { Store, ShoppingBag, Briefcase, Home, Car, Search, Plus, MapPin, Phone, MessageCircle, Heart, Share2, Filter, TrendingUp } from 'lucide-react';

export default function Marketplace() {
  const [activeTab, setActiveTab] = useState('buy-sell');
  const [searchQuery, setSearchQuery] = useState('');
  const [createDialogOpen, setCreateDialogOpen] = useState(false);

  // Sample data
  const listings = [
    { id: 1, title: 'iPhone 14 Pro Max', price: 'Rs. 180,000', location: 'Tulsipur', category: 'Electronics', image: '📱', seller: 'Ram B.', verified: true },
    { id: 2, title: 'Honda Shine 125cc', price: 'Rs. 95,000', location: 'Dang', category: 'Vehicles', image: '🏍️', seller: 'Shyam K.', verified: true },
    { id: 3, title: 'Laptop Dell XPS 15', price: 'Rs. 250,000', location: 'Urahari', category: 'Electronics', image: '💻', seller: 'Hari P.', verified: false },
    { id: 4, title: 'Study Table + Chair', price: 'Rs. 8,500', location: 'Tulsipur', category: 'Furniture', image: '🪑', seller: 'Gita M.', verified: true },
    { id: 5, title: 'DSLR Camera Canon', price: 'Rs. 85,000', location: 'Dang', category: 'Electronics', image: '📷', seller: 'Amit S.', verified: true },
    { id: 6, title: 'Mountain Bike', price: 'Rs. 35,000', location: 'Urahari', category: 'Sports', image: '🚴', seller: 'Sita R.', verified: false },
  ];

  const jobs = [
    { id: 1, title: 'Web Developer', company: 'Tech Solutions', location: 'Tulsipur', type: 'Full-time', salary: 'Rs. 50,000/mo' },
    { id: 2, title: 'Graphic Designer', company: 'Creative Studio', location: 'Dang', type: 'Part-time', salary: 'Rs. 25,000/mo' },
    { id: 3, title: 'Teacher (Math)', company: 'ABC School', location: 'Urahari', type: 'Full-time', salary: 'Rs. 30,000/mo' },
    { id: 4, title: 'Sales Executive', company: 'Local Store', location: 'Tulsipur', type: 'Full-time', salary: 'Rs. 20,000/mo' },
  ];

  const rentals = [
    { id: 1, title: '2BHK Apartment', price: 'Rs. 15,000/mo', location: 'Tulsipur', type: 'Apartment', image: '🏠' },
    { id: 2, title: 'Shop Space - Main Road', price: 'Rs. 25,000/mo', location: 'Dang', type: 'Commercial', image: '🏪' },
    { id: 3, title: 'Single Room', price: 'Rs. 5,000/mo', location: 'Urahari', type: 'Room', image: '🛏️' },
    { id: 4, title: 'Scooter Honda Activa', price: 'Rs. 500/day', location: 'Tulsipur', type: 'Vehicle', image: '🛵' },
  ];

  const businesses = [
    { id: 1, name: 'Himalayan Restaurant', category: 'Food', rating: 4.5, location: 'Tulsipur', image: '🍽️' },
    { id: 2, name: 'Tech Repair Shop', category: 'Services', rating: 4.8, location: 'Dang', image: '🔧' },
    { id: 3, name: 'Fashion Store', category: 'Clothing', rating: 4.2, location: 'Urahari', image: '👗' },
    { id: 4, name: 'Fitness Gym', category: 'Health', rating: 4.6, location: 'Tulsipur', image: '💪' },
  ];

  const filteredListings = listings.filter(item => 
    item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <h1 className="text-2xl md:text-3xl font-black flex items-center gap-2">
          🛒 Marketplace
        </h1>
        <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2 btn-cosmic">
              <Plus className="w-4 h-4" />
              Post Listing
            </Button>
          </DialogTrigger>
          <DialogContent className="glass-card max-w-lg">
            <DialogHeader>
              <DialogTitle>Create New Listing</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Title</Label>
                <Input placeholder="What are you selling?" className="glass-card" />
              </div>
              <div>
                <Label>Category</Label>
                <Select>
                  <SelectTrigger className="glass-card">
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="electronics">Electronics</SelectItem>
                    <SelectItem value="vehicles">Vehicles</SelectItem>
                    <SelectItem value="furniture">Furniture</SelectItem>
                    <SelectItem value="clothing">Clothing</SelectItem>
                    <SelectItem value="sports">Sports</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Price (Rs.)</Label>
                <Input type="number" placeholder="Enter price" className="glass-card" />
              </div>
              <div>
                <Label>Location</Label>
                <Input placeholder="Your location" className="glass-card" />
              </div>
              <div>
                <Label>Description</Label>
                <Textarea placeholder="Describe your item..." className="glass-card" />
              </div>
              <div>
                <Label>Photos</Label>
                <Input type="file" accept="image/*" multiple className="glass-card" />
              </div>
              <Button className="w-full" onClick={() => { toast.success('Listing created!'); setCreateDialogOpen(false); }}>
                Post Listing
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
        <Input
          placeholder="Search marketplace..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10 glass-card"
        />
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="glass-card w-full justify-start mb-6 flex-wrap h-auto gap-1 p-2">
          <TabsTrigger value="buy-sell" className="gap-2">
            <ShoppingBag className="w-4 h-4" />
            Buy & Sell
          </TabsTrigger>
          <TabsTrigger value="jobs" className="gap-2">
            <Briefcase className="w-4 h-4" />
            Jobs
          </TabsTrigger>
          <TabsTrigger value="rentals" className="gap-2">
            <Home className="w-4 h-4" />
            Rentals
          </TabsTrigger>
          <TabsTrigger value="business" className="gap-2">
            <Store className="w-4 h-4" />
            Local Business
          </TabsTrigger>
        </TabsList>

        <TabsContent value="buy-sell" className="space-y-6">
          {/* Quick Categories */}
          <div className="flex flex-wrap gap-2">
            {['All', 'Electronics', 'Vehicles', 'Furniture', 'Clothing', 'Sports'].map((cat) => (
              <Button key={cat} variant="outline" size="sm" className="rounded-full">{cat}</Button>
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredListings.map((item) => (
              <Card key={item.id} className="glass-card hover-lift overflow-hidden">
                <CardContent className="p-4">
                  <div className="flex items-start gap-4">
                    <div className="text-4xl">{item.image}</div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold truncate">{item.title}</h3>
                      <p className="text-lg font-bold text-primary">{item.price}</p>
                      <p className="text-sm text-muted-foreground flex items-center gap-1">
                        <MapPin className="w-3 h-3" />{item.location}
                      </p>
                      <div className="flex items-center gap-2 mt-2">
                        <Badge variant="outline">{item.category}</Badge>
                        {item.verified && <Badge className="bg-green-500">Verified</Badge>}
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2 mt-4">
                    <Button className="flex-1" size="sm">
                      <MessageCircle className="w-4 h-4 mr-1" />
                      Contact
                    </Button>
                    <Button variant="ghost" size="icon">
                      <Heart className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="icon">
                      <Share2 className="w-4 h-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="jobs" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {jobs.map((job) => (
              <Card key={job.id} className="glass-card hover-lift">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-bold text-lg">{job.title}</h3>
                      <p className="text-muted-foreground">{job.company}</p>
                    </div>
                    <Badge variant="outline">{job.type}</Badge>
                  </div>
                  <div className="mt-4 space-y-2">
                    <p className="flex items-center gap-2 text-sm">
                      <MapPin className="w-4 h-4 text-muted-foreground" />
                      {job.location}
                    </p>
                    <p className="flex items-center gap-2 text-sm font-semibold text-primary">
                      <TrendingUp className="w-4 h-4" />
                      {job.salary}
                    </p>
                  </div>
                  <Button className="w-full mt-4">Apply Now</Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="rentals" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {rentals.map((rental) => (
              <Card key={rental.id} className="glass-card hover-lift">
                <CardContent className="p-4 text-center">
                  <div className="text-5xl mb-4">{rental.image}</div>
                  <h3 className="font-bold">{rental.title}</h3>
                  <p className="text-lg font-bold text-primary">{rental.price}</p>
                  <p className="text-sm text-muted-foreground flex items-center justify-center gap-1 mt-2">
                    <MapPin className="w-3 h-3" />{rental.location}
                  </p>
                  <Badge variant="outline" className="mt-2">{rental.type}</Badge>
                  <Button className="w-full mt-4" variant="outline">View Details</Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="business" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {businesses.map((biz) => (
              <Card key={biz.id} className="glass-card hover-lift">
                <CardContent className="p-4">
                  <div className="flex items-center gap-4">
                    <div className="text-4xl">{biz.image}</div>
                    <div className="flex-1">
                      <h3 className="font-bold text-lg">{biz.name}</h3>
                      <p className="text-sm text-muted-foreground">{biz.category}</p>
                      <p className="text-sm flex items-center gap-1 mt-1">
                        <MapPin className="w-3 h-3" />{biz.location}
                      </p>
                      <div className="flex items-center gap-1 mt-2">
                        <span className="text-yellow-500">★</span>
                        <span className="font-semibold">{biz.rating}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2 mt-4">
                    <Button className="flex-1" size="sm">
                      <Phone className="w-4 h-4 mr-1" />
                      Call
                    </Button>
                    <Button className="flex-1" size="sm" variant="outline">
                      <MapPin className="w-4 h-4 mr-1" />
                      Directions
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
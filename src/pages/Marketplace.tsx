import { Card, CardContent } from '@/components/ui/card';
import { Construction, ShoppingCart } from 'lucide-react';

export default function Marketplace() {
  return (
    <div className="space-y-4 pb-20">
      <h1 className="text-xl font-bold flex items-center gap-2">🛒 Marketplace</h1>
      
      <Card className="glass-card border-primary/30">
        <CardContent className="py-16 text-center">
          <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
            <Construction className="w-10 h-10 text-primary animate-bounce" />
          </div>
          <h2 className="text-2xl font-bold mb-2">Marketplace</h2>
          <p className="text-xl text-muted-foreground mb-4">Under Construction</p>
          <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
            <ShoppingCart className="w-4 h-4" />
            <span>Coming Soon!</span>
          </div>
          <p className="text-xs text-muted-foreground mt-4 max-w-sm mx-auto">
            We're building an amazing marketplace for you to buy, sell, find jobs, rent, 
            discover businesses, and support NGOs. Stay tuned!
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

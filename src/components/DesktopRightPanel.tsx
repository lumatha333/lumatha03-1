import { useNavigate } from 'react-router-dom';
import {
    Compass, BookOpen, ShoppingBag, Gamepad2, Mountain,
    TrendingUp, Users, UserPlus
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';

export function DesktopRightPanel() {
    const navigate = useNavigate();

    const exploreItems = [
        { icon: Compass, label: 'Explore', route: '/search', color: 'text-blue-500', bg: 'bg-blue-500/10' },
        { icon: BookOpen, label: 'Learn', route: '/education', color: 'text-teal-500', bg: 'bg-teal-500/10' },
        { icon: ShoppingBag, label: 'Market', route: '/marketplace', color: 'text-amber-500', bg: 'bg-amber-500/10' },
        { icon: Mountain, label: 'Adventure', route: '/music-adventure', color: 'text-orange-500', bg: 'bg-orange-500/10' },
    ];

    const trendingTopics = [
        { tag: '#ArtificialIntelligence', posts: '125K posts' },
        { tag: '#WebDevelopment', posts: '82K posts' },
        { tag: '#UserExperience', posts: '45K posts' },
        { tag: '#ModernDesign', posts: '38K posts' },
        { tag: '#FutureTech', posts: '29K posts' },
    ];

    const suggestedPeople = [
        { id: '1', name: 'Alex Rivera', username: '@alex_r', avatar: 'https://i.pravatar.cc/150?u=1' },
        { id: '2', name: 'Sarah Chen', username: '@sarahc', avatar: 'https://i.pravatar.cc/150?u=2' },
        { id: '3', name: 'Jordan Smyth', username: '@jsmyth', avatar: 'https://i.pravatar.cc/150?u=3' },
    ];

    return (
        <aside className="hidden lg:flex w-[320px] flex-col gap-6 py-6 overflow-y-auto shrink-0 sticky top-[60px] h-[calc(100vh-60px)] px-4">
            {/* Explore Section */}
            <section className="space-y-4">
                <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-wider px-2">Explore Lumatha</h3>
                <div className="grid grid-cols-2 gap-2">
                    {exploreItems.map((item) => {
                        const Icon = item.icon;
                        return (
                            <button
                                key={item.label}
                                onClick={() => navigate(item.route)}
                                className="flex flex-col items-center gap-2 p-3 rounded-2xl bg-muted/30 hover:bg-muted/50 transition-all group"
                            >
                                <div className={`w-10 h-10 rounded-xl ${item.bg} flex items-center justify-center group-hover:scale-110 transition-transform`}>
                                    <Icon className={`w-5 h-5 ${item.color}`} />
                                </div>
                                <span className="text-xs font-semibold">{item.label}</span>
                            </button>
                        );
                    })}
                </div>
            </section>

            {/* Trending Topics */}
            <Card className="rounded-2xl border-border/40 bg-muted/20">
                <CardHeader className="pb-3 pt-4 px-4">
                    <CardTitle className="text-sm font-bold flex items-center gap-2">
                        <TrendingUp className="w-4 h-4 text-primary" />
                        Trending for you
                    </CardTitle>
                </CardHeader>
                <CardContent className="px-4 pb-4 space-y-4">
                    {trendingTopics.map((topic) => (
                        <div key={topic.tag} className="group cursor-pointer">
                            <div className="text-sm font-bold text-foreground hover:underline">{topic.tag}</div>
                            <div className="text-[10px] text-muted-foreground">{topic.posts}</div>
                        </div>
                    ))}
                    <Button variant="ghost" className="w-full text-xs text-primary hover:text-primary/80 hover:bg-primary/5 h-8">
                        Show more
                    </Button>
                </CardContent>
            </Card>

            {/* Suggested People */}
            <Card className="rounded-2xl border-border/40 bg-muted/20">
                <CardHeader className="pb-3 pt-4 px-4">
                    <CardTitle className="text-sm font-bold flex items-center gap-2">
                        <Users className="w-4 h-4 text-primary" />
                        Who to follow
                    </CardTitle>
                </CardHeader>
                <CardContent className="px-4 pb-4 space-y-4">
                    {suggestedPeople.map((person) => (
                        <div key={person.id} className="flex items-center gap-3 group">
                            <Avatar className="w-10 h-10 border border-border/50">
                                <AvatarImage src={person.avatar} />
                                <AvatarFallback>{person.name[0]}</AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                                <div className="text-sm font-bold truncate leading-tight">{person.name}</div>
                                <div className="text-[10px] text-muted-foreground truncate leading-tight">{person.username}</div>
                            </div>
                            <Button size="icon" variant="outline" className="h-8 w-8 rounded-full border-primary/30 text-primary hover:bg-primary/5 group-hover:bg-primary group-hover:text-white transition-colors">
                                <UserPlus className="w-4 h-4" />
                            </Button>
                        </div>
                    ))}
                    <Button variant="ghost" className="w-full text-xs text-primary hover:text-primary/80 hover:bg-primary/5 h-8">
                        Show more
                    </Button>
                </CardContent>
            </Card>

            {/* Footer Links */}
            <div className="px-4 text-[10px] text-muted-foreground flex flex-wrap gap-x-3 gap-y-1">
                <button className="hover:underline">Privacy</button>
                <button className="hover:underline">Terms</button>
                <button className="hover:underline">Cookies</button>
                <button className="hover:underline">Ads</button>
                <button className="hover:underline">More</button>
                <span>© 2026 Lumatha</span>
            </div>
        </aside>
    );
}

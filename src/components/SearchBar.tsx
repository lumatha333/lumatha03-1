import { useState, useCallback, useEffect } from 'react';
import { Search, User, FileText } from 'lucide-react';
import { Input } from '@/components/ui/input';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { debounce } from 'lodash';

export function SearchBar() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [users, setUsers] = useState<any[]>([]);
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const searchContent = useCallback(
    debounce(async (searchQuery: string) => {
      if (!searchQuery.trim()) {
        setUsers([]);
        setPosts([]);
        return;
      }

      setLoading(true);
      try {
        // Search users
        const { data: usersData } = await supabase
          .from('profiles')
          .select('*')
          .ilike('name', `%${searchQuery}%`)
          .limit(5);

        // Search posts
        const { data: postsData } = await supabase
          .from('posts')
          .select('id, title, category')
          .or(`title.ilike.%${searchQuery}%,content.ilike.%${searchQuery}%`)
          .eq('visibility', 'public')
          .limit(5);

        setUsers(usersData || []);
        setPosts(postsData || []);
      } catch (error) {
        console.error('Search error:', error);
      } finally {
        setLoading(false);
      }
    }, 300),
    []
  );

  useEffect(() => {
    searchContent(query);
  }, [query, searchContent]);

  const handleSelect = (type: 'user' | 'post', id: string) => {
    setOpen(false);
    setQuery('');
    if (type === 'user') {
      navigate(`/profile/${id}`);
    } else {
      navigate(`/public?post=${id}`);
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <div className="relative w-full max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => setOpen(true)}
            placeholder="Search users and content..."
            className="pl-10"
          />
        </div>
      </PopoverTrigger>
      <PopoverContent className="w-[400px] p-0" align="start">
        <Command>
          <CommandList>
            {loading ? (
              <div className="p-4 text-center text-sm text-muted-foreground">
                Searching...
              </div>
            ) : !query.trim() ? (
              <div className="p-4 text-center text-sm text-muted-foreground">
                Type to search users and content
              </div>
            ) : (
              <>
                <CommandEmpty>No results found</CommandEmpty>
                
                {users.length > 0 && (
                  <CommandGroup heading="Users">
                    {users.map((user) => (
                      <CommandItem
                        key={user.id}
                        onSelect={() => handleSelect('user', user.id)}
                        className="cursor-pointer"
                      >
                        <User className="mr-2 h-4 w-4" />
                        <div className="flex items-center gap-2">
                          {user.avatar_url && (
                            <img
                              src={user.avatar_url}
                              alt={user.name}
                              className="h-6 w-6 rounded-full object-cover"
                            />
                          )}
                          <span>{user.name}</span>
                        </div>
                      </CommandItem>
                    ))}
                  </CommandGroup>
                )}

                {posts.length > 0 && (
                  <CommandGroup heading="Posts">
                    {posts.map((post) => (
                      <CommandItem
                        key={post.id}
                        onSelect={() => handleSelect('post', post.id)}
                        className="cursor-pointer"
                      >
                        <FileText className="mr-2 h-4 w-4" />
                        <div>
                          <p className="font-medium">{post.title}</p>
                          <p className="text-xs text-muted-foreground">{post.category}</p>
                        </div>
                      </CommandItem>
                    ))}
                  </CommandGroup>
                )}
              </>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

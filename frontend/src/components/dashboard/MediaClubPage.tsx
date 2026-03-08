import { Plus, Image, Video, FileText, Eye, Heart } from "lucide-react";

const posts = [
  { title: "Campus Life: Spring Edition", type: "Photo", author: "Media Team", date: "Apr 3", views: 1240, likes: 89, status: "Published" },
  { title: "Sports Day 2026 Highlights", type: "Video", author: "John Carter", date: "Apr 1", views: 3450, likes: 201, status: "Published" },
  { title: "New Library Wing Opening", type: "Article", author: "Sarah Mills", date: "Mar 29", views: 560, likes: 44, status: "Draft" },
  { title: "Orientation Week Recap", type: "Photo", author: "Media Team", date: "Mar 25", views: 2100, likes: 145, status: "Published" },
];

const typeIcon: Record<string, React.ElementType> = { Photo: Image, Video: Video, Article: FileText };
const typeColor: Record<string, string> = { Photo: "gradient-info", Video: "gradient-red", Article: "gradient-success" };

export const MediaClubPage = () => (
  <div className="space-y-5 animate-fade-in">
    <div className="flex items-center justify-between">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Media Club</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Manage posts, media and publications</p>
      </div>
      <button className="flex items-center gap-2 px-4 py-2.5 rounded-xl gradient-red text-white text-sm font-semibold hover:opacity-90 transition-opacity shadow-md">
        <Plus size={16} /> New Post
      </button>
    </div>

    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      {[
        { label: "Total Posts", value: 622, color: "text-primary" },
        { label: "Published", value: 556, color: "text-success" },
        { label: "Drafts", value: 66, color: "text-warning" },
        { label: "Total Views", value: "98K", color: "text-info" },
      ].map((s) => (
        <div key={s.label} className="bg-card rounded-xl p-4 border border-border shadow-card">
          <p className="text-xs text-muted-foreground">{s.label}</p>
          <p className={`text-2xl font-bold mt-1 ${s.color}`}>{s.value}</p>
        </div>
      ))}
    </div>

    <div className="bg-card rounded-2xl border border-border shadow-card">
      <div className="p-5 border-b border-border">
        <h3 className="font-semibold text-foreground">Recent Posts</h3>
      </div>
      <div className="divide-y divide-border">
        {posts.map((post) => {
          const Icon = typeIcon[post.type];
          return (
            <div key={post.title} className="flex items-center gap-4 p-4 hover:bg-muted/20 transition-colors">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-white flex-shrink-0 ${typeColor[post.type]}`}>
                <Icon size={18} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-foreground truncate">{post.title}</p>
                <p className="text-xs text-muted-foreground">{post.author} - {post.date}</p>
              </div>
              <div className="flex items-center gap-4 text-xs text-muted-foreground flex-shrink-0">
                <span className="flex items-center gap-1"><Eye size={11} />{post.views.toLocaleString()}</span>
                <span className="flex items-center gap-1"><Heart size={11} />{post.likes}</span>
              </div>
              <span className={`text-[10px] px-2.5 py-1 rounded-lg font-semibold border flex-shrink-0 ${post.status === "Published" ? "bg-success/10 text-success border-success/20" : "bg-warning/10 text-warning-foreground border-warning/20"}`}>{post.status}</span>
            </div>
          );
        })}
      </div>
    </div>
  </div>
);

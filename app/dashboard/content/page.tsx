import { samplePosts } from '@/lib/placeholderData';

export default function ContentLibrary() {
  return (
    <div className="space-y-8">
      <header className="border-b border-softGray/20 pb-6">
        <h1 className="text-4xl font-bold text-goldFoil font-playfair">Content Library</h1>
        <p className="text-softGray mt-2">Manage and organize your content</p>
      </header>

      <div className="flex gap-4">
        <button className="px-6 py-2 bg-goldFoil text-midnightBlack font-medium rounded-lg hover:bg-goldFoil/90 transition-all">
          Create New Post
        </button>
        <button className="px-6 py-2 bg-transparent border border-neonTeal text-neonTeal font-medium rounded-lg hover:bg-neonTeal/10 transition-all">
          Import Content
        </button>
      </div>

      <div className="grid gap-4">
        {samplePosts.map((post) => (
          <div
            key={post.id}
            className="bg-midnightBlack border border-softGray/20 rounded-lg p-6 hover:border-goldFoil/50 transition-all"
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h3 className="text-xl font-bold text-white">{post.title}</h3>
                <p className="text-softGray mt-2">{post.content}</p>
                <div className="flex gap-2 mt-4">
                  {post.platform.map((platform) => (
                    <span
                      key={platform}
                      className="px-3 py-1 bg-neonTeal/10 text-neonTeal text-sm rounded-full"
                    >
                      {platform}
                    </span>
                  ))}
                </div>
              </div>
              <div className="flex flex-col items-end">
                <span
                  className={`px-3 py-1 rounded-full text-sm font-medium ${
                    post.status === 'published'
                      ? 'bg-neonTeal/20 text-neonTeal'
                      : post.status === 'scheduled'
                      ? 'bg-goldFoil/20 text-goldFoil'
                      : 'bg-softGray/20 text-softGray'
                  }`}
                >
                  {post.status}
                </span>
                {post.scheduledDate && (
                  <span className="text-softGray text-sm mt-2">
                    {new Date(post.scheduledDate).toLocaleDateString()}
                  </span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

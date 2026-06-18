import type { Metadata } from 'next';
import { createServerSupabaseClient } from '@/lib/supabase/server';

type Props = {
  params: Promise<{ slug: string }>;
  children: React.ReactNode;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const supabase = await createServerSupabaseClient();

  const { data: evt } = await supabase
    .from('events')
    .select('title, slug, welcome_message, hero_images, hero_media, cover_photo, couple_names')
    .eq('slug', slug)
    .single();

  if (!evt) {
    return {
      title: 'Invitation',
      description: 'Vous êtes invité(e) à un événement',
    };
  }

  // Pick the best image: hero_media first image → hero_images first → cover_photo → fallback
  let ogImage: string | undefined;

  const heroMedia = evt.hero_media as { url: string; type: string }[] | null;
  if (heroMedia && heroMedia.length > 0) {
    const firstImage = heroMedia.find(m => m.type === 'image');
    if (firstImage) ogImage = firstImage.url;
  }

  if (!ogImage) {
    const heroImages = evt.hero_images as string[] | null;
    if (heroImages && heroImages.length > 0) {
      ogImage = heroImages[0];
    }
  }

  if (!ogImage && evt.cover_photo) {
    ogImage = evt.cover_photo as string;
  }

  const title = evt.couple_names
    ? `${evt.couple_names} — ${evt.title}`
    : evt.title || 'Invitation';

  const description = (evt.welcome_message as string) || 'Vous êtes cordialement invité(e) à célébrer ce moment avec nous';

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: 'website',
      ...(ogImage ? {
        images: [
          {
            url: ogImage,
            width: 1200,
            height: 630,
            alt: title,
          },
        ],
      } : {}),
    },
    twitter: {
      card: ogImage ? 'summary_large_image' : 'summary',
      title,
      description,
      ...(ogImage ? { images: [ogImage] } : {}),
    },
  };
}

export default function InvitationLayout({ children }: Props) {
  return <>{children}</>;
}

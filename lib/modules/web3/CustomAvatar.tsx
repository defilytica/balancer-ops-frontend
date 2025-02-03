import { Image, ImageProps } from "@chakra-ui/react";

interface CustomAvatarProps extends ImageProps {
  address: string;
  ensImage?: string | null;
  size: number;
}

export function CustomAvatar({ address, ensImage, size, alt, ...props }: CustomAvatarProps) {
  const avatarUrl = ensImage ?? `https://api.dicebear.com/7.x/thumbs/svg?seed=${address}`;

  return <Image alt={alt} height={size} src={avatarUrl} width={size} {...props} />;
}

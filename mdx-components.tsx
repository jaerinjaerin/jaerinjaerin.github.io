import defaultMdxComponents from 'fumadocs-ui/mdx';
import { MDXComponents } from 'mdx/types';
import { CopyHeader } from './components/blog/copy-header';
import { getAuthor, type AuthorKey } from '@/lib/authors';
import { AuthorCard } from './components/blog/author-card';
import {
  MediaViewer,
  ImageViewer,
  VideoViewer,
} from '@/components/common/media-viewer';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import Image from 'next/image';

const createHeading = (level: number) => {
  const Heading = ({
    children,
    ...props
  }: React.HTMLAttributes<HTMLHeadingElement>) => {
    return (
      <CopyHeader level={level} {...props}>
        {children}
      </CopyHeader>
    );
  };

  Heading.displayName = `Heading${level}`;
  return Heading;
};

interface AuthorProps {
  id: AuthorKey;
}

function Author({ id }: AuthorProps) {
  const author = getAuthor(id);
  return <AuthorCard author={author} className='my-8' />;
}

export function getMDXComponents(components?: MDXComponents): MDXComponents {
  return {
    ...defaultMdxComponents,
    MediaViewer,
    ImageViewer,
    VideoViewer,
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
    Author,
    h1: createHeading(1),
    h2: createHeading(2),
    h3: createHeading(3),
    h4: createHeading(4),
    h5: createHeading(5),
    h6: createHeading(6),
    img: (props) => <Image {...(props as any)} />,
    ...components,
  };
}

export const useMDXComponents = getMDXComponents;

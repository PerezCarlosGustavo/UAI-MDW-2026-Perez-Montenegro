import Link from "next/link";
import { Button } from "@/components/ui/button";

type Props = {
  href: string;
  titulo: string;
};

export default function BotonAgregar({ href, titulo }: Props) {
  return (
    <Button asChild>
      <Link href={href} aria-label={titulo}>
        <span aria-hidden="true">+</span> Agregar
      </Link>
    </Button>
  );
}

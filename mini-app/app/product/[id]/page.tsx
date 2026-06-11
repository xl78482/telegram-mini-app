import { ProductDetailPage } from '@/components/product-detail'
export default function ProductPage({ params }: { params: { id: string } }) {
  return <ProductDetailPage id={params.id} />
}

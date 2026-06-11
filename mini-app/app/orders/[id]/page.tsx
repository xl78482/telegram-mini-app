import { OrderDetailPage } from '@/components/order-detail'
export default function OrderDetailRoute({ params }: { params: { id: string } }) {
  return <OrderDetailPage id={params.id} />
}

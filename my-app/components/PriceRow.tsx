export default function PriceRow({
  symbol,
  details,
}: {
  symbol: string;
  details: any;
}) {
  return (
    <tr className="border-t">
      <td className="p-2 text-black">{symbol}</td>
      <td className="p-2 text-black">{details.price}</td>
    </tr>
  );
}

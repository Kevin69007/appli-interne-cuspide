
interface BalanceCheckProps {
  userBalance: number;
  price: number;
}

const BalanceCheck = ({ userBalance, price }: BalanceCheckProps) => {
  return (
    <div className="text-center text-sm text-gray-600">
      Your balance: {userBalance} PD
      {userBalance >= price && (
        <span className="text-green-600 ml-2">✓ Sufficient funds</span>
      )}
      {userBalance < price && (
        <span className="text-red-600 ml-2">✗ Insufficient funds</span>
      )}
    </div>
  );
};

export default BalanceCheck;

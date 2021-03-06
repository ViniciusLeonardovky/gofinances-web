import React, {
  useState,
  useEffect,
  useCallback,
  useMemo,
  Suspense,
  lazy,
} from 'react';
import { FiEdit, FiTrash2 } from 'react-icons/fi';
import Pagination from 'react-js-pagination';

import { toast } from 'react-toastify';
import income from '../../assets/income.svg';
import outcome from '../../assets/outcome.svg';
import total from '../../assets/total.svg';

import api from '../../services/api';

import Header from '../../components/Header';
import Loading from '../../components/Loading';

import formatValue from '../../utils/formatValue';
import formatDate from '../../utils/formatDate';

import {
  Container,
  CardContainer,
  Card,
  TableContainer,
  PagesButtonsContainer,
} from './styles';

const EditTransactionModal = lazy(
  () => import('../../components/EditTransactionModal'),
);

interface Transaction {
  id: string;
  title: string;
  value: string;
  formattedValue: string;
  formattedDate: string;
  type: 'income' | 'outcome';
  category: { title: string };
  created_at: Date;
}

interface Balance {
  income: string;
  outcome: string;
  total: string;
}

const Dashboard: React.FC = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [balance, setBalance] = useState<Balance>({} as Balance);
  const [currentPage, setCurrentPage] = useState(1);
  const [modalIsOpen, setModalIsOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction>(
    {} as Transaction,
  );
  const [totalTransactions, setTotalTransactions] = useState(0);
  const [limitPerPage] = useState(5);
  const [loadingCards, setLoadingCards] = useState(false);

  const openModal = useCallback((transaction: Transaction) => {
    setEditingTransaction(transaction);
    setModalIsOpen(true);
  }, []);

  const closeModal = useCallback(() => {
    setModalIsOpen(false);
  }, []);

  const loadTransactions = useCallback(async () => {
    setLoadingCards(true);
    const response = await api.get(
      `/transactions?page=${currentPage}&limit=${limitPerPage}`,
    );
    setTransactions(response.data.transactions);

    setBalance({
      income: response.data.balance.income,
      outcome: response.data.balance.outcome,
      total: response.data.balance.total,
    });

    setTotalTransactions(response.data.totalTransactions);
    setLoadingCards(false);
  }, [currentPage, limitPerPage]);

  useEffect(() => {
    loadTransactions();
  }, [loadTransactions]);

  const transactionsList = useMemo(() => {
    return transactions.map(transaction => ({
      ...transaction,
      title:
        transaction.title.length <= 15
          ? transaction.title
          : transaction.title.substr(0, 15).concat('...'),
      formattedValue: formatValue(Number(transaction.value)),
      formattedDate: formatDate(transaction.created_at),
    }));
  }, [transactions]);

  const incomeBalance = useMemo(() => {
    return formatValue(Number(balance.income));
  }, [balance]);

  const outcomeBalance = useMemo(() => {
    return formatValue(Number(balance.outcome));
  }, [balance]);

  const totalBalance = useMemo(() => {
    return formatValue(Number(balance.total));
  }, [balance]);

  const handleChangePage = useCallback(prevOrNext => {
    setCurrentPage(prevOrNext);
  }, []);

  const handleDeleteTransaction = useCallback(
    async (id: string) => {
      await api.delete(`transactions/${id}`);
      toast.success('Transação removida com sucesso!');
      const newTransactions = transactions.filter(
        transaction => transaction.id !== id,
      );
      setTransactions(newTransactions);
    },
    [transactions],
  );

  return (
    <>
      <Header />
      <Suspense fallback={<></>}>
        <EditTransactionModal
          closeModal={closeModal}
          isOpen={modalIsOpen}
          editingTransaction={editingTransaction}
        />
      </Suspense>
      <Container>
        <CardContainer>
          <Card>
            {incomeBalance === 'R$ NaN' ? (
              <Loading isLoading={loadingCards} color="#5636d3" size={40} />
            ) : (
              <div>
                <header>
                  <p>Entradas</p>
                  <img src={income} alt="Income" />
                </header>
                <h1 data-testid="balance-income">{incomeBalance}</h1>
              </div>
            )}
          </Card>
          <Card>
            {outcomeBalance === 'R$ NaN' ? (
              <Loading isLoading={loadingCards} color="#5636d3" size={40} />
            ) : (
              <div>
                <header>
                  <p>Saídas</p>
                  <img src={outcome} alt="Outcome" />
                </header>
                <h1 data-testid="balance-income">{outcomeBalance}</h1>
              </div>
            )}
          </Card>
          <Card total>
            {outcomeBalance === 'R$ NaN' ? (
              <Loading isLoading={loadingCards} color="#5636d3" size={40} />
            ) : (
              <div>
                <header>
                  <p>Total</p>
                  <img src={total} alt="Total" />
                </header>
                <h1 data-testid="balance-total">{totalBalance}</h1>
              </div>
            )}
          </Card>
        </CardContainer>
        {loadingCards ? (
          <div className="loading">
            <Loading isLoading={loadingCards} color="#5636d3" size={70} />
          </div>
        ) : (
          <TableContainer>
            <table>
              <thead>
                <tr>
                  <th>Título</th>
                  <th>Preço</th>
                  <th>Categoria</th>
                  <th>Data</th>
                  <th>Ações</th>
                </tr>
              </thead>
              <tbody>
                {transactionsList.map(transaction => (
                  <tr key={transaction.id}>
                    <td className="title">{transaction.title}</td>
                    {transaction.type === 'income' ? (
                      <td className="income">{transaction.formattedValue}</td>
                    ) : (
                      <td className="outcome">{`- ${transaction.formattedValue}`}</td>
                    )}
                    <td>{transaction.category.title}</td>
                    <td>{transaction.formattedDate}</td>
                    <td className="transaction-actions">
                      <button
                        type="button"
                        onClick={() => openModal(transaction)}
                      >
                        <FiEdit color="#3bafda" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteTransaction(transaction.id)}
                      >
                        <FiTrash2 color="#ff4b5b" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <PagesButtonsContainer>
              <Pagination
                activePage={currentPage}
                itemsCountPerPage={limitPerPage}
                totalItemsCount={totalTransactions}
                pageRangeDisplayed={5}
                onChange={handleChangePage}
              />
            </PagesButtonsContainer>
          </TableContainer>
        )}
      </Container>
    </>
  );
};

export default Dashboard;

import React, { useMemo } from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    Box,
    CircularProgress,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper
} from '@mui/material';

const AccountDetailDialog = ({ open, onClose, accountDetail, loading }) => {
    const formatDate = (dateValue) => {
        if (!dateValue) return '';
        const date = new Date(dateValue);
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        const month = months[date.getMonth()];
        const day = String(date.getDate()).padStart(2, '0');
        const year = date.getFullYear();
        return `${month}-${day}-${year}`;
    };

    const formatAmount = (amount) => {
        if (amount === null || amount === undefined) return '';
        return `$${Math.abs(amount).toFixed(2)}`;
    };

    const { rowData, debitTotal, creditTotal } = useMemo(() => {
        if (!accountDetail || accountDetail.length === 0) {
            return { rowData: [], debitTotal: 0, creditTotal: 0 };
        }
        
        let debitSum = 0;
        let creditSum = 0;
        
        const rows = accountDetail.map((transaction, index) => {
            const debit = transaction.amount < 0 ? transaction.amount : null;
            const credit = transaction.amount >= 0 ? transaction.amount : null;
            
            if (debit !== null) debitSum += Math.abs(debit);
            if (credit !== null) creditSum += credit;
            
            return {
                id: index,
                date: transaction.stamp,
                description: transaction.description,
                debit: debit,
                credit: credit
            };
        });
        
        return { rowData: rows, debitTotal: debitSum, creditTotal: creditSum };
    }, [accountDetail]);

    return (
        <Dialog 
            open={open}
            onClose={onClose}
            maxWidth="md"
            fullWidth
        >
            <DialogTitle>Account Details</DialogTitle>
            <DialogContent>
                {loading ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                        <CircularProgress />
                    </Box>
                ) : (
                    <TableContainer component={Paper} sx={{ mt: 2 }}>
                        <Table>
                            <TableHead>
                                <TableRow>
                                    <TableCell>Date</TableCell>
                                    <TableCell>Description</TableCell>
                                    <TableCell align="right">Debit</TableCell>
                                    <TableCell align="right">Credit</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {rowData.length > 0 ? (
                                    <>
                                        {rowData.map((row) => (
                                            <TableRow key={row.id} hover>
                                                <TableCell sx={{ color: row.debit !== null ? 'red' : row.credit !== null ? 'green' : 'inherit' }}>
                                                    {formatDate(row.date)}
                                                </TableCell>
                                                <TableCell sx={{ color: row.debit !== null ? 'red' : row.credit !== null ? 'green' : 'inherit' }}>
                                                    {row.description}
                                                </TableCell>
                                                <TableCell align="right" sx={{ color: row.debit !== null ? 'red' : row.credit !== null ? 'green' : 'inherit' }}>
                                                    {formatAmount(row.debit)}
                                                </TableCell>
                                                <TableCell align="right" sx={{ color: row.debit !== null ? 'red' : row.credit !== null ? 'green' : 'inherit' }}>
                                                    {formatAmount(row.credit)}
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                        <TableRow>
                                            <TableCell colSpan={2} align="right" sx={{ fontWeight: 'bold', borderTop: 2 }}>
                                                Subtotals:
                                            </TableCell>
                                            <TableCell align="right" sx={{ fontWeight: 'bold', borderTop: 2 }}>
                                                {formatAmount(debitTotal)}
                                            </TableCell>
                                            <TableCell align="right" sx={{ fontWeight: 'bold', borderTop: 2 }}>
                                                {formatAmount(creditTotal)}
                                            </TableCell>
                                        </TableRow>
                                    </>
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={4} align="center">
                                            No account details available
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </TableContainer>
                )}
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose} color="primary">
                    Close
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default AccountDetailDialog;

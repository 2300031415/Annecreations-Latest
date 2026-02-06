'use client';

import React, { useState } from 'react';
import {
  Table, TableBody, TableCell, TableContainer, TableHead, TablePagination, TableRow,
  useMediaQuery, Box, Typography
} from '@mui/material';
import CartItemRow from './CartItemRow';

const CartTable = ({ items }) => {
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);
  const isMobile = useMediaQuery('(max-width:640px)');

  const paginatedItems = items.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

  // MOBILE: vertical cards
  if (isMobile) {
    return (
      <Box className="w-full md:w-[70%]">
        {paginatedItems.length === 0 ? (
          <Typography align="center" mt={2}>Your cart is empty.</Typography>
        ) : (
          paginatedItems.map((item) => <CartItemRow key={item._id} item={item} />)
        )}
        <TablePagination
          component="div"
          count={items.length}
          page={page}
          onPageChange={(e, newPage) => setPage(newPage)}
          rowsPerPage={rowsPerPage}
          onRowsPerPageChange={(e) => {
            setRowsPerPage(parseInt(e.target.value, 10));
            setPage(0);
          }}
          rowsPerPageOptions={[5, 10, 15]}
        />
      </Box>
    );
  }

  // DESKTOP: table layout
  return (
    <Box className="w-full lg:w-[70%]">
      <TableContainer sx={{ borderRadius: 2, border: '2px solid var(--primary)' }}>
        <Table stickyHeader>
          <TableHead>
            <TableRow sx={{ borderBottom: '2px solid var(--primary)' }}>
              {['Design Image', 'Design Code', 'Price'].map((heading) => (
                <TableCell key={heading} sx={{ color: '#311807', fontWeight: 'bold', fontSize: 16, borderBottom: 'none' }}>
                  {heading}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {paginatedItems.length === 0 ? (
              <TableRow>
                <TableCell colSpan={3} align="center" sx={{ py: 4 }}>
                  Your cart is empty.
                </TableCell>
              </TableRow>
            ) : (
              paginatedItems.map((item) => <CartItemRow key={item._id} item={item} />)
            )}
          </TableBody>
        </Table>

        <TablePagination
          component="div"
          count={items.length}
          page={page}
          onPageChange={(e, newPage) => setPage(newPage)}
          rowsPerPage={rowsPerPage}
          onRowsPerPageChange={(e) => {
            setRowsPerPage(parseInt(e.target.value, 10));
            setPage(0);
          }}
          rowsPerPageOptions={[5, 10, 15]}
        />
      </TableContainer>
    </Box>
  );
};

export default CartTable;

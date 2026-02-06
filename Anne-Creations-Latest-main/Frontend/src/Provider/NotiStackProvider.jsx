'use client';

import { SnackbarProvider, closeSnackbar } from 'notistack';
import PropTypes from 'prop-types';

export const NotistackProvider = ({ children }) => {
  return (
    <SnackbarProvider
      maxSnack={3}
      anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      autoHideDuration={3000}
      preventDuplicate
      action={(snackbarId) => (
        <button onClick={() => closeSnackbar(snackbarId)} className="cursor-pointer hover:underline" >
          Dismiss
        </button>
      )}
    >
      {children}
    </SnackbarProvider>
  );
};

// ✅ Props validation
NotistackProvider.propTypes = {
  children: PropTypes.node.isRequired,
};

import { useState, useEffect } from "react";
import PropTypes from "prop-types";
import SoftBox from "components/SoftBox";
import SoftButton from "components/SoftButton";
import Modal from "@mui/material/Modal";

import Card from "@mui/material/Card";
import MoonLoader from "react-spinners/MoonLoader";
import SoftTypography from "components/SoftTypography";
import Grid from "@mui/material/Grid";
import SoftSelect from "components/SoftSelect";
import FormField from "views/dashboard/components/EditTransaction/FormField";
import axios from "axios";
import data from "config.json";

import CreateRoundedIcon from "@mui/icons-material/CreateRounded";

const EditTransaction = (props) => {
  const [open, setOpen] = useState(false);
  const [updatePending, setUpdatePending] = useState(false);
  const [deletePending, setDeletePending] = useState(false);
  const [disabled, setDisabled] = useState(true);

  const [description, setDescription] = useState("");
  const [displayDate, setDisplayDate] = useState("");
  const [transaction, setTransaction] = useState({
    id: "",
    summarised_description: "",
    category: "",
    date: "",
    amount: "",
    currency: "",
  });

  const category = [
    { value: "Miscellaneous", label: "Miscellaneous" },
    { value: "Dining", label: "Dining" },
    { value: "Shopping", label: "Shopping" },
    { value: "Entertainment", label: "Entertainment" },
    { value: "Transfers", label: "Transfers" },
    { value: "Healthcare", label: "Healthcare" },
    { value: "Groceries", label: "Groceries" },
    { value: "Subscriptions", label: "Subscriptions" },
    { value: "Loans", label: "Loans" },
    { value: "Housing", label: "Housing" },
    { value: "Transport", label: "Transport" },
    { value: "Utilities", label: "Utilities" },
    { value: "Taxes", label: "Taxes" },
    { value: "Insurance", label: "Insurance" },
  ];

  const handleClose = () => {
    setOpen(false);
  };

  const handleOpen = () => {
    setOpen(true);
  };

  const handleUpdate = async () => {
    setUpdatePending(true);
    setDisabled(true);
    try {
      await axios({
        method: "put",
        url: `${data.apiRootUrl}transactions/${transaction.id}`,
        data: {
          date: transaction.date,
          simple_description: transaction.summarised_description,
          category: transaction.category,
          original_amount: parseFloat(transaction.amount),
          original_currency: transaction.currency,
        },
        withCredentials: true,
      });

      props.setRefresh(props.refresh + 1);
      handleClose();
    } catch (error) {
      console.error(err);
      if (err.response && err.response.status === 401) {
        window.location.href = "/sign-in";
      }
    } finally {
      setDisabled(false);
      setUpdatePending(false);
    }
  };

  const handleDelete = async () => {
    try {
      setDisabled(true);
      setDeletePending(true);
      await axios({
        method: "delete",
        url: `${data.apiRootUrl}transactions/${transaction.id}`,
        withCredentials: true,
      });

      // Close the modal after successful deletion
      props.setRefresh(props.refresh + 1);
      handleClose();
      // Refresh the transactions list (if needed)
    } catch (err) {
      console.error(err);
      if (err.response && err.response.status === 401) {
        window.location.href = "/sign-in";
      }
    } finally {
      setDeletePending(false);
      setDisabled(false);
    }
  };

  useEffect(() => {
    if (open) {
      setTransaction({
        id: "",
        summarised_description: "",
        category: "",
        date: "",
        amount: "",
        currency: "",
      });
      setDescription("");
      setDisplayDate("");
      setDisabled(true);

      let tmp_id = props.id.split("_")[props.id.split("_").length - 1];
      const fetchTransactions = async () => {
        try {
          const response = await axios({
            method: "get",
            url: data.apiRootUrl + "transactions",
            withCredentials: true,
            params: {
              id: tmp_id,
            },
          });

          const transaction = response.data.data;
          setDescription(transaction.original_description);
          setDisplayDate(transaction.date.substring(0, 10));
          setTransaction({
            id: tmp_id,
            summarised_description: transaction.simple_description,
            category: transaction.category,
            date: transaction.date, // Store the full ISO date for API submission
            amount: parseFloat(transaction.original_amount).toFixed(2),
            currency: transaction.original_currency,
          });

          setDisabled(false);
        } catch (err) {
          console.log(err);
          if (err.response.status === 401) {
            window.location.href = "/sign-in";
          }
        }
      };

      fetchTransactions();
    }
  }, [open]);
  return (
    <>
      <SoftBox width={{ xs: "100%", sm: "40%" }} textAlign="right" mt={{ xs: 2, sm: "auto" }}>
        <SoftButton variant="gradient" color="dark" onClick={handleOpen} iconOnly circular>
          <CreateRoundedIcon />
        </SoftButton>
      </SoftBox>
      <Modal open={open} onClose={handleClose}>
        <Card sx={{ width: "90%", margin: "auto", marginTop: "5%" }}>
          <SoftBox p={3} lineHeight={1}>
            <SoftBox mb={1}>
              <SoftTypography variant="h5">Edit Transaction</SoftTypography>
            </SoftBox>

            <SoftBox component="form" py={3} px={1}>
              <Grid container spacing={3}>
                <Grid item xs={12} sm={12}>
                  <SoftBox
                    display="flex"
                    flexDirection="column"
                    justifyContent="flex-end"
                    height="100%"
                  >
                    <SoftBox ml={0.5} lineHeight={0} display="inline-block">
                      <SoftTypography
                        component="label"
                        variant="caption"
                        fontWeight="bold"
                        textTransform="capitalize"
                      >
                        Original description:{" "}
                      </SoftTypography>
                      <SoftTypography variant="caption">{description}</SoftTypography>
                    </SoftBox>
                  </SoftBox>
                </Grid>
                <Grid item xs={12} sm={12}>
                  <FormField
                    label="Summarised Description"
                    value={transaction.summarised_description}
                    onChange={(e) => {
                      setTransaction({ ...transaction, summarised_description: e.target.value });
                    }}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <SoftBox mb={1} ml={0.5} lineHeight={0} display="inline-block">
                    <SoftTypography
                      component="label"
                      variant="caption"
                      fontWeight="bold"
                      textTransform="capitalize"
                    >
                      Category
                    </SoftTypography>
                  </SoftBox>
                  <SoftSelect
                    label="Category"
                    value={{ value: transaction.category, label: transaction.category }}
                    options={category}
                    onChange={(e) => {
                      setTransaction({ ...transaction, category: e.value });
                    }}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <FormField
                    label="Date"
                    value={displayDate}
                    onChange={(e) => {
                      const selectedDate = new Date(e.target.value);
                      selectedDate.setHours(23, 59, 59, 999); // Set the time to 23:59:59
                      const isoString = selectedDate.toISOString();
                      setDisplayDate(e.target.value);
                      setTransaction({
                        ...transaction,
                        date: isoString, // For sending to the API
                      });
                    }}
                    inputProps={{ type: "date" }}
                  />
                </Grid>
                <Grid item xs={8} sm={9}>
                  <FormField
                    label="Amount"
                    value={transaction.amount}
                    onChange={(e) => {
                      setTransaction({ ...transaction, amount: e.target.value });
                    }}
                    inputProps={{ type: "number", step: "0.01" }}
                  />
                </Grid>
                <Grid item xs={4} sm={3}>
                  <FormField
                    label="Currency"
                    value={transaction.currency}
                    onChange={(e) => {
                      setTransaction({ ...transaction, currency: e.target.value });
                    }}
                  />
                </Grid>
              </Grid>
            </SoftBox>
          </SoftBox>
          <SoftBox pb={3} px={3} display="flex" justifyContent="space-between" alignItems="center">
            <SoftBox display="flex" width="100%" flexDirection="row" gap={2}>
              <SoftButton
                variant="outlined"
                color="error"
                onClick={handleDelete}
                sx={{ minWidth: "80px" }}
                disabled={disabled}
              >
                {deletePending ? <MoonLoader size={20} color="red" /> : "Delete"}
              </SoftButton>
              <SoftButton
                variant="gradient"
                color="dark"
                sx={{ flexGrow: 1 }}
                onClick={handleUpdate}
                disabled={disabled}
              >
                {updatePending ? <MoonLoader size={20} color="white" /> : "Update"}
              </SoftButton>
            </SoftBox>
          </SoftBox>
          <SoftBox pb={2} px={3} display="flex" justifyContent="center">
            <SoftTypography variant="caption" color="text">
              Transaction ID: {transaction.id}
            </SoftTypography>
          </SoftBox>
        </Card>
      </Modal>
    </>
  );
};
EditTransaction.propTypes = {
  id: PropTypes.string,
  refresh: PropTypes.number,
  setRefresh: PropTypes.func,
};

export default EditTransaction;

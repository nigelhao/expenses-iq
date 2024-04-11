import { useState, useEffect } from "react";

import { Link } from "react-router-dom";

import axios from "axios";
import Swal from "sweetalert2";

import SoftBox from "components/SoftBox";
import SoftTypography from "components/SoftTypography";
import SoftInput from "components/SoftInput";
import SoftButton from "components/SoftButton";

import IllustrationLayout from "layouts/IllustrationLayout";

import rocket from "assets/images/illustrations/rocket-white.png";

import data from "config.json";

const showAlert = () =>
  Swal.fire("Welcome", "Your account have been created successfully", "success");
const showError = () => Swal.fire("Error", "Something went wrong", "error");
const showAccountExist = () => Swal.fire("Failed", "Email already exist", "error");
const showEmptyField = () => Swal.fire("Failed", "Please fill in all the required fields", "error");

function Illustration() {
  const [isUpdate, setUpdate] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");

  const handleSubmit = async () => {
    setUpdate(true);

    try {
      if (email === "" || password === "" || name === "") {
        showEmptyField();
      } else {
        const response = await axios.post(
          data.apiRootUrl + "sign-up",
          {
            email,
            password,
            name,
          },
          { withCredentials: true }
        );

        if (response.status === 201) {
          setEmail("");
          setPassword("");
          setName("");
          showAlert();
        }
      }
    } catch (error) {
      console.log(error);
      if (error.response && error.response.status === 409) {
        showAccountExist();
      } else {
        showError();
      }
    } finally {
      setUpdate(false);
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        await axios.get(data.apiRootUrl + "sign-up", { withCredentials: true });
      } catch (error) {
        console.error(error);
        if (error.response && error.response.status === 401) {
          window.location.href = "/dashboard";
        }
      }
    };

    fetchData();
  }, []);

  return (
    <IllustrationLayout
      title="Sign Up"
      description="Enter your email and password to register"
      illustration={{
        image: rocket,
        title: "Your journey starts here",
        description:
          "Just as it takes a company to sustain a product, it takes a community to sustain a protocol.",
      }}
    >
      <SoftBox component="form" role="form">
        <SoftBox mb={2}>
          <SoftInput
            placeholder="Name"
            size="large"
            value={name}
            onChange={(e) => {
              setName(e.target.value);
            }}
          />
        </SoftBox>
        <SoftBox mb={2}>
          <SoftInput
            type="email"
            placeholder="Email"
            size="large"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
            }}
          />
        </SoftBox>
        <SoftBox mb={2}>
          <SoftInput
            type="password"
            placeholder="Password"
            size="large"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
            }}
          />
        </SoftBox>
        <SoftBox mt={4} mb={1}>
          <SoftButton
            variant="gradient"
            color="info"
            size="large"
            fullWidth
            onClick={handleSubmit}
            disabled={isUpdate}
          >
            sign up
          </SoftButton>
        </SoftBox>
        <SoftBox mt={3} textAlign="center">
          <SoftTypography variant="button" color="text" fontWeight="regular">
            Already have an account?&nbsp;
            <SoftTypography
              component={Link}
              to="/sign-in"
              variant="button"
              color="info"
              fontWeight="bold"
              textGradient
            >
              Sign in
            </SoftTypography>
          </SoftTypography>
        </SoftBox>
      </SoftBox>
    </IllustrationLayout>
  );
}

export default Illustration;

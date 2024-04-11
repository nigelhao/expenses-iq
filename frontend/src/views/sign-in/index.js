import { useState, useEffect } from "react";

import { Link } from "react-router-dom";

import SoftBox from "components/SoftBox";
import SoftTypography from "components/SoftTypography";
import SoftInput from "components/SoftInput";
import SoftButton from "components/SoftButton";

import axios from "axios";

import Swal from "sweetalert2";

import IllustrationLayout from "layouts/IllustrationLayout";

import data from "config.json";

// Image
import chat from "assets/images/illustrations/chat.png";

const showError = () => Swal.fire("Error", "Something went wrong", "error");
const showWrongCredential = () => Swal.fire("Failed", "Incorrect username or password", "error");

function Illustration() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isUpdate, setUpdate] = useState(false);

  const handleSubmit = async () => {
    setUpdate(true);

    try {
      if (email === "" || password === "") {
        showWrongCredential();
      } else {
        const response = await axios.post(
          data.apiRootUrl + "sign-in",
          {
            email: email,
            password: password,
          },
          {
            withCredentials: true,
          }
        );
        if (response.status === 200) {
          window.location.href = "/dashboard";
        }
      }
    } catch (error) {
      console.log(error);
      if (error.response && error.response.status === 401) {
        showWrongCredential();
        setEmail("");
        setPassword("");
      } else {
        showError();
      }
    } finally {
      setUpdate(false);
    }
  };

  useEffect(() => {
    const checkAuthentication = async () => {
      try {
        await axios.get(data.apiRootUrl + "sign-in", {
          withCredentials: true,
        });
      } catch (error) {
        console.error(error);
        if (error.response && error.response.status === 401) {
          window.location.href = "/dashboard";
        }
      }
    };

    checkAuthentication();
  }, []);

  return (
    <IllustrationLayout
      title="Sign In"
      description="Enter your email and password to sign in"
      illustration={{
        image: chat,
        title: '"Attention is the new currency"',
        description:
          "The more effortless the writing looks, the more effort the writer actually put into the process.",
      }}
    >
      <SoftBox component="form" role="form">
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
            sign in
          </SoftButton>
        </SoftBox>
        <SoftBox mt={3} textAlign="center">
          <SoftTypography variant="button" color="text" fontWeight="regular">
            Don&apos;t have an account?{" "}
            <SoftTypography
              component={Link}
              to="/sign-up"
              variant="button"
              color="info"
              fontWeight="medium"
              textGradient
            >
              Sign up
            </SoftTypography>
          </SoftTypography>
        </SoftBox>
      </SoftBox>
    </IllustrationLayout>
  );
}

export default Illustration;

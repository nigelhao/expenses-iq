/**
=========================================================
* Soft UI Dashboard PRO React - v4.0.3
=========================================================

* Product Page: https://www.creative-tim.com/product/soft-ui-dashboard-pro-react
* Copyright 2024 Creative Tim (https://www.creative-tim.com)

Coded by www.creative-tim.com

 =========================================================

* The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.
*/

import { useState, useEffect } from "react";

// react-router components
import { useLocation, Link } from "react-router-dom";

// prop-types is a library for typechecking of props.
import PropTypes from "prop-types";

// @mui core components
import AppBar from "@mui/material/AppBar";
import Toolbar from "@mui/material/Toolbar";
import IconButton from "@mui/material/IconButton";
import Menu from "@mui/material/Menu";
import Icon from "@mui/material/Icon";

// Soft UI Dashboard PRO React components
import SoftBox from "components/SoftBox";

// Custom styles for DashboardNavbar
const navbar = (theme, ownerState) => {
  const { palette, boxShadows, functions, transitions, breakpoints, borders } = theme;
  const { transparentNavbar, absolute, light } = ownerState;

  const { dark, white, text, transparent } = palette;
  const { navbarBoxShadow } = boxShadows || { navbarBoxShadow: "0 0 2rem 0 rgba(0,0,0,.15)" };
  const { rgba, pxToRem } = functions || {
    rgba: (color, opacity) => `rgba(${color}, ${opacity})`,
    pxToRem: (px) => `${px / 16}rem`,
  };
  const { borderRadius } = borders || { borderRadius: { xl: "1rem" } };

  return {
    boxShadow: transparentNavbar || absolute ? "none" : navbarBoxShadow,
    backdropFilter: transparentNavbar || absolute ? "none" : `saturate(200%) blur(${pxToRem(30)})`,
    backgroundColor:
      transparentNavbar || absolute
        ? `${transparent?.main || "transparent"} !important`
        : rgba(white?.main || "#fff", 0.8),

    color: () => {
      let color;

      if (light) {
        color = white?.main || "#fff";
      } else if (transparentNavbar) {
        color = text?.main || "#344767";
      } else {
        color = dark?.main || "#344767";
      }

      return color;
    },
    top: absolute ? 0 : pxToRem(2),
    // Hide navbar on desktop (xl and above)
    [breakpoints.up("xl")]: {
      display: "none !important",
    },
    minHeight: pxToRem(1),
    display: "grid",
    alignItems: "center",
    borderRadius: borderRadius.xl,
    paddingTop: pxToRem(2),
    paddingBottom: pxToRem(2),
    paddingRight: pxToRem(2),
    paddingLeft: pxToRem(2),

    "& > *": {
      transition: transitions?.create
        ? transitions.create("all", {
            easing: transitions.easing?.easeInOut || "ease-in-out",
            duration: transitions.duration?.standard || 300,
          })
        : "all 300ms ease-in-out",
    },

    "& .MuiToolbar-root": {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",

      [breakpoints.up("sm")]: {
        minHeight: "auto",
        padding: `${pxToRem(2)} ${pxToRem(4)}`,
      },
    },
  };
};

const navbarContainer = ({ breakpoints }) => ({
  flexDirection: "column",
  alignItems: "flex-start",
  justifyContent: "space-between",
  pt: 0,
  pb: 0,

  [breakpoints.up("md")]: {
    flexDirection: "row",
    alignItems: "center",
    paddingTop: "0",
    paddingBottom: "0",
  },
});

const navbarRow = ({ breakpoints }, { isMini }) => ({
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  width: "100%",

  [breakpoints.up("md")]: {
    justifyContent: isMini ? "space-between" : "stretch",
    width: isMini ? "100%" : "max-content",
  },

  [breakpoints.up("xl")]: {
    justifyContent: "stretch !important",
    width: "max-content !important",
  },
});

const navbarMobileMenu = ({ breakpoints }) => ({
  display: "inline-block",
  lineHeight: 0,
});

// Soft UI Dashboard PRO React context
import { useSoftUIController, setTransparentNavbar, setMiniSidenav } from "context";

function DashboardNavbar({ absolute = false, light = false, isMini = false }) {
  const [navbarType, setNavbarType] = useState();
  const [controller, dispatch] = useSoftUIController();
  const { miniSidenav, transparentNavbar, fixedNavbar } = controller;

  useEffect(() => {
    // Setting the navbar type
    if (fixedNavbar) {
      setNavbarType("sticky");
    } else {
      setNavbarType("static");
    }

    // A function that sets the transparent state of the navbar.
    function handleTransparentNavbar() {
      setTransparentNavbar(dispatch, (fixedNavbar && window.scrollY === 0) || !fixedNavbar);
    }

    /** 
     The event listener that's calling the handleTransparentNavbar function when 
     scrolling the window.
    */
    window.addEventListener("scroll", handleTransparentNavbar);

    // Call the handleTransparentNavbar function to set the state with the initial value.
    handleTransparentNavbar();

    // Remove event listener on cleanup
    return () => window.removeEventListener("scroll", handleTransparentNavbar);
  }, [dispatch, fixedNavbar]);

  // Add an effect to handle miniSidenav on mobile/desktop
  useEffect(() => {
    // Function to handle window resize
    function handleResize() {
      // If on desktop (xl breakpoint and above), ensure sidenav is not mini
      if (window.innerWidth >= 1200) {
        // xl breakpoint is typically 1200px
        setMiniSidenav(dispatch, false);
      }
    }

    // Add event listener
    window.addEventListener("resize", handleResize);

    // Call once on component mount
    handleResize();

    // Cleanup
    return () => window.removeEventListener("resize", handleResize);
  }, [dispatch]);

  const handleMiniSidenav = () => setMiniSidenav(dispatch, !miniSidenav);

  return (
    <AppBar
      position={absolute ? "absolute" : navbarType}
      color="inherit"
      sx={(theme) => navbar(theme, { transparentNavbar, absolute, light })}
    >
      <Toolbar sx={(theme) => ({ ...navbarContainer(theme), minHeight: "5px", p: 0 })}>
        <SoftBox color="inherit" sx={(theme) => ({ ...navbarRow(theme, { isMini }), p: 0 })}>
          <SoftBox sx={{ display: "flex", justifyContent: "flex-end", width: "100%", p: 0 }}>
            <IconButton
              size="small"
              color="inherit"
              sx={{ ...navbarMobileMenu, p: 0 }}
              onClick={handleMiniSidenav}
            >
              <Icon className={light ? "text-white" : "text-dark"}>
                {miniSidenav ? "menu" : "menu_open"}
              </Icon>
            </IconButton>
          </SoftBox>
        </SoftBox>
      </Toolbar>
    </AppBar>
  );
}

// Typechecking props for the DashboardNavbar
DashboardNavbar.propTypes = {
  absolute: PropTypes.bool,
  light: PropTypes.bool,
  isMini: PropTypes.bool,
};

export default DashboardNavbar;

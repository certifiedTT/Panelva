import React from "react";
import { NextPageContext } from "next";

function Error({ statusCode }: { statusCode?: number }) {
  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#07080a", color: "white", display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column" }}>
      <h1 style={{ fontSize: "2rem", fontWeight: "bold" }}>
        {statusCode ? `Error ${statusCode}` : "An error occurred"}
      </h1>
    </div>
  );
}

Error.getInitialProps = ({ res, err }: NextPageContext) => {
  const statusCode = res ? res.statusCode : err ? err.statusCode : 404;
  return { statusCode };
};

export default Error;

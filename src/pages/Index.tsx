import Layout from "@/components/layout/Layout";

const Index = () => {
  return (
    <Layout>
      <section className="container py-20 md:py-32">
        <div className="max-w-3xl mx-auto text-center animate-fade-in">
          <span className="inline-block px-3 py-1 text-xs font-medium rounded-full bg-secondary text-primary mb-6">
            Coming soon
          </span>
          <h1 className="font-heading text-4xl md:text-6xl font-bold tracking-tight">
            Your professional portfolio,{" "}
            <span className="text-primary">beautifully built.</span>
          </h1>
          <p className="mt-6 text-lg text-muted-foreground">
            PortoBank is the modern portfolio platform for every profession — from designers and
            developers to doctors, chefs, and architects.
          </p>
        </div>
      </section>
    </Layout>
  );
};

export default Index;

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/hooks/useAuth";
import { useActiveCampanhaId } from "@/hooks/useCampanhaData";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { FileText, Download, BarChart3, PieChart, TrendingUp, Users } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart as RechartsPieChart, Pie, Cell } from 'recharts';
import { Navbar } from "@/components/Navbar";

interface ExpenseData {
  category: string;
  amount: number;
  count: number;
}

interface MonthlyData {
  month: string;
  expenses: number;
}

interface OperatorProductivity {
  name: string;
  userId: string;
  checkins: number;
  feedbacks: number;
  streets: number;
}

interface CityProductivity {
  cidade: string;
  checkins: number;
  streets: number;
  investimento: number;
}

const Reports = () => {
  const { user } = useAuth();
  const activeCampanhaId = useActiveCampanhaId();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [expensesByCategory, setExpensesByCategory] = useState<ExpenseData[]>([]);
  const [monthlyExpenses, setMonthlyExpenses] = useState<MonthlyData[]>([]);
  const [totalExpenses, setTotalExpenses] = useState(0);
  const [totalBudget, setTotalBudget] = useState(0);
  const [operatorData, setOperatorData] = useState<OperatorProductivity[]>([]);
  const [cityProductivity, setCityProductivity] = useState<CityProductivity[]>([]);

  const categoryColors = [
    '#3B82F6', '#10B981', '#F59E0B', '#EF4444', 
    '#8B5CF6', '#06B6D4', '#F97316', '#84CC16'
  ];

  const categoryLabels: Record<string, string> = {
    publicidade: 'Publicidade',
    transporte: 'Transporte',
    alimentacao: 'Alimentação',
    material: 'Material',
    eventos: 'Eventos',
    pessoal: 'Pessoal',
    outros: 'Outros'
  };

  useEffect(() => {
    fetchReportData();
  }, [user, activeCampanhaId]);

  const fetchReportData = async () => {
    if (!user) return;

    try {
      let expQuery = supabase.from('expenses').select('category, amount, date');
      if (activeCampanhaId) expQuery = expQuery.eq('campanha_id', activeCampanhaId);

      let budgetQuery = supabase.from('budgets').select('total_planned').eq('active', true);
      if (activeCampanhaId) budgetQuery = budgetQuery.eq('campanha_id', activeCampanhaId);

      let checkinsQuery = supabase.from('street_checkins').select('user_id, street_id, feedback_clima, feedback_demandas, streets(cidade)');
      if (activeCampanhaId) checkinsQuery = checkinsQuery.eq('campanha_id', activeCampanhaId);

      let profilesQuery = supabase.from('profiles').select('id, name') as any;
      if (activeCampanhaId) profilesQuery = profilesQuery.eq('campanha_id', activeCampanhaId);

      let resourcesQuery = supabase.from('resource_requests' as any).select('valor_estimado, cidade, status');
      if (activeCampanhaId) resourcesQuery = (resourcesQuery as any).eq('campanha_id', activeCampanhaId).eq('status', 'aprovado');

      const [expRes, budgetRes, checkinsRes, profilesRes, resourcesRes] = await Promise.all([
        expQuery,
        budgetQuery.single(),
        checkinsQuery,
        profilesQuery,
        resourcesQuery,
      ]);

      if (expRes.error) throw expRes.error;

      // Process expenses
      const categoryData: Record<string, { amount: number, count: number }> = {};
      let total = 0;
      expRes.data?.forEach(expense => {
        if (!categoryData[expense.category]) categoryData[expense.category] = { amount: 0, count: 0 };
        categoryData[expense.category].amount += expense.amount;
        categoryData[expense.category].count += 1;
        total += expense.amount;
      });

      const categoryArray = Object.entries(categoryData).map(([category, data]) => ({
        category: categoryLabels[category] || category,
        amount: data.amount,
        count: data.count
      }));

      const monthlyData: Record<string, number> = {};
      expRes.data?.forEach(expense => {
        const date = new Date(expense.date);
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        monthlyData[monthKey] = (monthlyData[monthKey] || 0) + expense.amount;
      });

      const monthlyArray = Object.entries(monthlyData)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([month, expenses]) => ({
          month: new Date(month + '-01').toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' }),
          expenses
        }));

      // Process productivity by operator
      const profileMap = new Map<string, string>();
      (profilesRes.data || []).forEach((p: any) => profileMap.set(p.id, p.name));

      const opMap: Record<string, { checkins: number; feedbacks: number; streetSet: Set<string> }> = {};
      const cityMap: Record<string, { checkins: number; streetSet: Set<string> }> = {};

      for (const c of (checkinsRes.data || []) as any[]) {
        const uid = c.user_id;
        if (!opMap[uid]) opMap[uid] = { checkins: 0, feedbacks: 0, streetSet: new Set() };
        opMap[uid].checkins++;
        opMap[uid].streetSet.add(c.street_id);
        if (c.feedback_clima || c.feedback_demandas) opMap[uid].feedbacks++;

        const city = c.streets?.cidade || "Sem cidade";
        if (!cityMap[city]) cityMap[city] = { checkins: 0, streetSet: new Set() };
        cityMap[city].checkins++;
        cityMap[city].streetSet.add(c.street_id);
      }

      const operators: OperatorProductivity[] = Object.entries(opMap)
        .map(([uid, d]) => ({
          userId: uid,
          name: profileMap.get(uid) || "Operador",
          checkins: d.checkins,
          feedbacks: d.feedbacks,
          streets: d.streetSet.size,
        }))
        .sort((a, b) => b.checkins - a.checkins);

      const resourcesByCity: Record<string, number> = {};
      for (const r of (resourcesRes.data || []) as any[]) {
        const city = r.cidade || "Sem cidade";
        resourcesByCity[city] = (resourcesByCity[city] || 0) + Number(r.valor_estimado);
      }

      const cities: CityProductivity[] = Object.entries(cityMap)
        .map(([cidade, d]) => ({
          cidade,
          checkins: d.checkins,
          streets: d.streetSet.size,
          investimento: resourcesByCity[cidade] || 0,
        }))
        .sort((a, b) => b.checkins - a.checkins);

      setExpensesByCategory(categoryArray);
      setMonthlyExpenses(monthlyArray);
      setTotalExpenses(total);
      setTotalBudget(budgetRes.data?.total_planned || 0);
      setOperatorData(operators);
      setCityProductivity(cities);
    } catch (error) {
      console.error('Error fetching report data:', error);
      toast({ title: "Erro ao carregar dados", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const budgetUsedPercentage = totalBudget > 0 ? (totalExpenses / totalBudget) * 100 : 0;

  const handleExportPDF = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto px-4 py-8">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-muted rounded w-1/4" />
            <div className="h-32 bg-muted rounded" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background print:bg-white">
      <div className="print:hidden"><Navbar /></div>
      <div className="container mx-auto px-4">
        <div className="sticky top-14 sm:top-16 z-40 bg-background pb-4 print:static print:pb-0">
          <div className="flex items-center justify-between pt-8 print:mb-4">
            <div>
              <h1 className="text-3xl font-bold">Relatórios</h1>
              <p className="text-muted-foreground print:hidden">Análises e relatórios da campanha</p>
            </div>
            <Button onClick={handleExportPDF} variant="campaign" className="gap-2 print:hidden">
              <Download className="w-4 h-4" />
              Exportar PDF
            </Button>
          </div>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                 <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center print:bg-primary">
                   <FileText className="w-6 h-6 text-primary print:text-primary-foreground" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold">R$ {totalExpenses.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</h3>
                  <p className="text-muted-foreground">Total Gasto</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                 <div className="w-12 h-12 bg-success/10 rounded-xl flex items-center justify-center print:bg-secondary">
                   <TrendingUp className="w-6 h-6 text-success" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold">R$ {totalBudget.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</h3>
                  <p className="text-muted-foreground">Orçamento Total</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                 <div className="w-12 h-12 bg-accent rounded-xl flex items-center justify-center print:bg-accent">
                   <BarChart3 className="w-6 h-6 text-accent-foreground" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold">{budgetUsedPercentage.toFixed(1)}%</h3>
                  <p className="text-muted-foreground">Orçamento Usado</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="financeiro" className="print:block">
          <TabsList className="mb-6 print:hidden">
            <TabsTrigger value="financeiro">Financeiro</TabsTrigger>
            <TabsTrigger value="produtividade">Produtividade</TabsTrigger>
          </TabsList>

          {/* Financial Tab */}
          <TabsContent value="financeiro" className="print:block">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2"><PieChart className="w-5 h-5" /> Gastos por Categoria</CardTitle>
                </CardHeader>
                <CardContent>
                  {expensesByCategory.length > 0 ? (
                    <ResponsiveContainer width="100%" height={300}>
                      <RechartsPieChart>
                        <Pie data={expensesByCategory} dataKey="amount" nameKey="category" cx="50%" cy="50%" outerRadius={100} label={({ category }) => categoryLabels[category] || category}>
                          {expensesByCategory.map((_, index) => (
                            <Cell key={`cell-${index}`} fill={categoryColors[index % categoryColors.length]} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value: number) => [`R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, 'Valor']} />
                      </RechartsPieChart>
                    </ResponsiveContainer>
                  ) : <div className="text-center py-12 text-muted-foreground">Nenhum dado disponível</div>}
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2"><BarChart3 className="w-5 h-5" /> Gastos Mensais</CardTitle>
                </CardHeader>
                <CardContent>
                  {monthlyExpenses.length > 0 ? (
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={monthlyExpenses}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="month" />
                        <YAxis />
                        <Tooltip formatter={(value: number) => [`R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, 'Gastos']} />
                        <Bar dataKey="expenses" fill="hsl(var(--primary))" />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : <div className="text-center py-12 text-muted-foreground">Nenhum dado disponível</div>}
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Detalhamento por Categoria</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {expensesByCategory.map((category, index) => (
                    <div key={category.category} className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="w-4 h-4 rounded-full" style={{ backgroundColor: categoryColors[index % categoryColors.length] }} />
                        <div>
                          <h4 className="font-medium">{category.category}</h4>
                          <p className="text-sm text-muted-foreground">{category.count} transações</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold">R$ {category.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                        <p className="text-sm text-muted-foreground">{((category.amount / totalExpenses) * 100).toFixed(1)}% do total</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Productivity Tab */}
          <TabsContent value="produtividade" className="print:block print:mt-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
              {/* Operator ranking */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2"><Users className="w-5 h-5" /> Produtividade por Operador</CardTitle>
                  <CardDescription>Quem fez o quê — check-ins, ruas e feedbacks</CardDescription>
                </CardHeader>
                <CardContent>
                  {operatorData.length > 0 ? (
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b">
                            <th className="text-left py-3 px-2">#</th>
                            <th className="text-left py-3 px-2">Operador</th>
                            <th className="text-right py-3 px-2">Check-ins</th>
                            <th className="text-right py-3 px-2">Ruas</th>
                            <th className="text-right py-3 px-2">Feedbacks</th>
                          </tr>
                        </thead>
                        <tbody>
                          {operatorData.map((op, i) => (
                            <tr key={op.userId} className="border-b last:border-0">
                              <td className="py-3 px-2 text-muted-foreground">{i + 1}</td>
                              <td className="py-3 px-2 font-medium">{op.name}</td>
                              <td className="py-3 px-2 text-right">{op.checkins}</td>
                              <td className="py-3 px-2 text-right">{op.streets}</td>
                              <td className="py-3 px-2 text-right">{op.feedbacks}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : <div className="text-center py-12 text-muted-foreground">Nenhum dado de produtividade</div>}
                </CardContent>
              </Card>

              {/* City ranking */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2"><BarChart3 className="w-5 h-5" /> Ranking por Cidade</CardTitle>
                  <CardDescription>Efetividade: ruas visitadas vs. investimento</CardDescription>
                </CardHeader>
                <CardContent>
                  {cityProductivity.length > 0 ? (
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b">
                            <th className="text-left py-3 px-2">Cidade</th>
                            <th className="text-right py-3 px-2">Check-ins</th>
                            <th className="text-right py-3 px-2">Ruas</th>
                            <th className="text-right py-3 px-2">Investimento</th>
                          </tr>
                        </thead>
                        <tbody>
                          {cityProductivity.map((c) => (
                            <tr key={c.cidade} className="border-b last:border-0">
                              <td className="py-3 px-2 font-medium">{c.cidade}</td>
                              <td className="py-3 px-2 text-right">{c.checkins}</td>
                              <td className="py-3 px-2 text-right">{c.streets}</td>
                              <td className="py-3 px-2 text-right">R$ {c.investimento.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : <div className="text-center py-12 text-muted-foreground">Nenhum dado de produtividade</div>}
                </CardContent>
              </Card>
            </div>

            {/* Operator chart */}
            {operatorData.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Check-ins por Operador</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={operatorData.slice(0, 10)} layout="vertical">
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis type="number" />
                        <YAxis type="category" dataKey="name" width={120} fontSize={12} />
                        <Tooltip />
                        <Bar dataKey="checkins" name="Check-ins" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
                        <Bar dataKey="feedbacks" name="Feedbacks" fill="hsl(142 76% 36%)" radius={[0, 4, 4, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Reports;

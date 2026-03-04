import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { PlusCircle, Receipt, Calendar } from "lucide-react";
import { Database } from "@/integrations/supabase/types";

import { Navbar } from "@/components/Navbar";

interface Expense {
  id: string;
  date: string;
  category: string;
  description: string;
  amount: number;
  payment_method: string;
  document_url?: string;
  created_at: string;
}

const categories = [
  { value: 'publicidade', label: 'Publicidade' },
  { value: 'transporte', label: 'Transporte' },
  { value: 'alimentacao', label: 'Alimentação' },
  { value: 'material', label: 'Material' },
  { value: 'eventos', label: 'Eventos' },
  { value: 'pessoal', label: 'Pessoal' },
  { value: 'outros', label: 'Outros' }
] as const;

const paymentMethods = [
  { value: 'pix', label: 'PIX' },
  { value: 'cartao', label: 'Cartão' },
  { value: 'dinheiro', label: 'Dinheiro' },
  { value: 'transferencia', label: 'Transferência' },
  { value: 'boleto', label: 'Boleto' }
] as const;

const Expenses = () => {
  const { user, campanhaId, selectedCampanhaId, profile, isMaster } = useAuth();
  const activeCampanhaId = selectedCampanhaId || campanhaId;
  const { toast } = useToast();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [showForm, setShowForm] = useState(false);

  const [form, setForm] = useState({
    date: new Date().toISOString().split('T')[0],
    category: "",
    description: "",
    amount: "",
    payment_method: ""
  });

  useEffect(() => {
    fetchExpenses();
  }, [user, activeCampanhaId]);

  const fetchExpenses = async () => {
    if (!user) return;

    try {
      let query = supabase.from('expenses').select('*').order('date', { ascending: false });
      if (activeCampanhaId) query = query.eq('campanha_id', activeCampanhaId);
      const { data, error } = await query;

      if (error) {
        toast({ title: "Erro ao carregar despesas", description: error.message, variant: "destructive" });
      } else {
        setExpenses(data || []);
      }
    } catch (error) {
      console.error('Error fetching expenses:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setCreating(true);

    try {
      if (!activeCampanhaId) {
        toast({ title: "Erro", description: "Selecione uma campanha primeiro.", variant: "destructive" });
        return;
      }

      const { error } = await supabase.from('expenses').insert({
        candidate_id: profile?.candidate_id || undefined,
        campanha_id: activeCampanhaId,
        date: form.date,
        category: form.category as Database["public"]["Enums"]["expense_category"],
        description: form.description,
        amount: parseFloat(form.amount),
        payment_method: form.payment_method as Database["public"]["Enums"]["payment_method"],
        created_by: user.id
      });

      if (error) {
        toast({ title: "Erro ao registrar despesa", description: error.message, variant: "destructive" });
      } else {
        toast({ title: "Despesa registrada!", description: "Despesa registrada com sucesso." });
        setForm({ date: new Date().toISOString().split('T')[0], category: "", description: "", amount: "", payment_method: "" });
        setShowForm(false);
        fetchExpenses();
      }
    } catch (error) {
      console.error('Error creating expense:', error);
    } finally {
      setCreating(false);
    }
  };

  const totalExpenses = expenses.reduce((sum, expense) => sum + expense.amount, 0);

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
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">Despesas</h1>
          <p className="text-sm text-muted-foreground">Controle de gastos da campanha</p>
        </div>
        <Button onClick={() => setShowForm(!showForm)} variant="campaign" className="gap-2 w-full sm:w-auto">
          <PlusCircle className="w-4 h-4" /> Nova Despesa
        </Button>
      </div>

      <Card className="mb-8">
        <CardContent className="p-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center">
              <Receipt className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h3 className="text-2xl font-bold">
                R$ {totalExpenses.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </h3>
              <p className="text-muted-foreground">Total de despesas registradas</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {showForm && (
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Registrar Nova Despesa</CardTitle>
            <CardDescription>Adicione uma nova despesa da campanha</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="date">Data</Label>
                  <Input id="date" type="date" value={form.date} onChange={(e) => setForm(prev => ({ ...prev, date: e.target.value }))} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="category">Categoria</Label>
                  <Select value={form.category} onValueChange={(value) => setForm(prev => ({ ...prev, category: value }))}>
                    <SelectTrigger><SelectValue placeholder="Selecione a categoria" /></SelectTrigger>
                    <SelectContent>
                      {categories.map((category) => (
                        <SelectItem key={category.value} value={category.value}>{category.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Descrição</Label>
                <Textarea id="description" value={form.description} onChange={(e) => setForm(prev => ({ ...prev, description: e.target.value }))} placeholder="Descreva a despesa..." required />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="amount">Valor (R$)</Label>
                  <Input id="amount" type="number" step="0.01" value={form.amount} onChange={(e) => setForm(prev => ({ ...prev, amount: e.target.value }))} placeholder="0,00" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="payment_method">Forma de Pagamento</Label>
                  <Select value={form.payment_method} onValueChange={(value) => setForm(prev => ({ ...prev, payment_method: value }))}>
                    <SelectTrigger><SelectValue placeholder="Selecione o método" /></SelectTrigger>
                    <SelectContent>
                      {paymentMethods.map((method) => (
                        <SelectItem key={method.value} value={method.value}>{method.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="flex gap-2">
                <Button type="submit" disabled={creating} variant="campaign">{creating ? "Registrando..." : "Registrar Despesa"}</Button>
                <Button type="button" variant="outline" onClick={() => setShowForm(false)}>Cancelar</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4">
        {expenses.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <Receipt className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">Nenhuma despesa encontrada</h3>
              <p className="text-muted-foreground mb-4">Comece registrando suas primeiras despesas de campanha</p>
              <Button onClick={() => setShowForm(true)} variant="campaign">Registrar Primeira Despesa</Button>
            </CardContent>
          </Card>
        ) : (
          expenses.map((expense) => (
            <Card key={expense.id}>
              <CardContent className="p-4 sm:p-6">
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-2">
                      <Calendar className="w-4 h-4 text-muted-foreground shrink-0" />
                      <span className="text-sm text-muted-foreground">{new Date(expense.date).toLocaleDateString('pt-BR')}</span>
                      <span className="text-xs sm:text-sm bg-muted px-2 py-0.5 sm:py-1 rounded">{categories.find(c => c.value === expense.category)?.label}</span>
                    </div>
                    <h4 className="font-semibold mb-1 text-sm sm:text-base truncate">{expense.description}</h4>
                    <p className="text-xs sm:text-sm text-muted-foreground">{paymentMethods.find(p => p.value === expense.payment_method)?.label}</p>
                  </div>
                  <div className="text-left sm:text-right shrink-0">
                    <p className="text-base sm:text-lg font-bold">
                      R$ {expense.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
    </div>
  );
};

export default Expenses;

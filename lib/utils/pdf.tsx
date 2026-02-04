import { Document, Page, Text, View, Image, Font, StyleSheet } from '@react-pdf/renderer'

// Register fonts (optional - using system fonts)
Font.register({
  family: 'Helvetica',
  fonts: [
    { src: 'https://cdnjs.cloudflare.com/ajax/libs/pdfmake/0.1.66/fonts/Roboto/Roboto-Regular.ttf' },
    { src: 'https://cdnjs.cloudflare.com/ajax/libs/pdfmake/0.1.66/fonts/Roboto/Roboto-Bold.ttf', fontWeight: 'bold' },
  ],
})

const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontFamily: 'Helvetica',
    fontSize: 10,
  },
  header: {
    marginBottom: 30,
  },
  logo: {
    width: 80,
    height: 80,
    marginBottom: 10,
  },
  businessName: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  businessInfo: {
    fontSize: 9,
    color: '#666',
    marginBottom: 2,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#333',
  },
  documentNumber: {
    fontSize: 14,
    marginBottom: 5,
  },
  infoSection: {
    marginBottom: 30,
  },
  infoRow: {
    flexDirection: 'row',
    marginBottom: 3,
  },
  infoLabel: {
    width: 80,
    color: '#666',
  },
  infoValue: {
    flex: 1,
  },
  table: {
    marginBottom: 20,
  },
  tableHeader: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
    paddingBottom: 8,
    marginBottom: 8,
  },
  tableHeaderCell: {
    fontSize: 9,
    fontWeight: 'bold',
    color: '#333',
  },
  description: { flex: 3 },
  quantity: { flex: 1, textAlign: 'center' },
  rate: { flex: 1, textAlign: 'right' },
  amount: { flex: 1, textAlign: 'right' },
  tableRow: {
    flexDirection: 'row',
    marginBottom: 6,
  },
  tableCell: {
    fontSize: 9,
  },
  exemptBadge: {
    backgroundColor: '#f3f4f6',
    color: '#6b7280',
    fontSize: 7,
    paddingHorizontal: 4,
    paddingVertical: 2,
    borderRadius: 2,
    marginLeft: 4,
  },
  totals: {
    alignSelf: 'flex-end',
    width: 200,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 5,
  },
  totalLabel: {
    color: '#666',
  },
  totalValue: {
    fontWeight: 'bold',
  },
  grandTotal: {
    borderTopWidth: 1,
    borderTopColor: '#333',
    paddingTop: 8,
    marginTop: 5,
  },
  exemptLabel: {
    color: '#999',
    fontStyle: 'italic',
  },
  notes: {
    marginTop: 30,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#ddd',
  },
  notesTitle: {
    fontSize: 11,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  notesText: {
    fontSize: 9,
    color: '#666',
  },
})

interface EstimateDocumentProps {
  estimate: any
  client: any
  business: any
}

export function EstimatePDF({ estimate, client, business }: EstimateDocumentProps) {
  // Determine if we should show tax breakdown
  const hasMixedTax = (estimate as any).taxable_subtotal > 0 && (estimate as any).exempt_subtotal > 0
  const hasAnyExemptItems = estimate.line_items?.some((item: any) => (item as any).tax_rate === 0)

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          {business?.logo_url && (
            // eslint-disable-next-line jsx-a11y/alt-text
            <Image src={business.logo_url} style={styles.logo} />
          )}
          <Text style={styles.businessName}>{business?.name || 'Your Business'}</Text>
          {business?.address && <Text style={styles.businessInfo}>{business.address}</Text>}
          {business?.phone && <Text style={styles.businessInfo}>{business.phone}</Text>}
          {business?.email && <Text style={styles.businessInfo}>{business.email}</Text>}
        </View>

        {/* Title */}
        <Text style={styles.title}>ESTIMATE</Text>
        <Text style={styles.documentNumber}>{estimate.estimate_number}</Text>

        {/* Info Section */}
        <View style={styles.infoSection}>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Client:</Text>
            <Text style={styles.infoValue}>{client?.name}</Text>
          </View>
          {client?.email && (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Email:</Text>
              <Text style={styles.infoValue}>{client.email}</Text>
            </View>
          )}
          {client?.phone && (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Phone:</Text>
              <Text style={styles.infoValue}>{client.phone}</Text>
            </View>
          )}
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Valid Until:</Text>
            <Text style={styles.infoValue}>
              {new Date(estimate.valid_until).toLocaleDateString()}
            </Text>
          </View>
        </View>

        {/* Line Items Table */}
        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <Text style={[styles.tableHeaderCell, styles.description]}>Description</Text>
            <Text style={[styles.tableHeaderCell, styles.quantity]}>Qty</Text>
            <Text style={[styles.tableHeaderCell, styles.rate]}>Rate</Text>
            <Text style={[styles.tableHeaderCell, styles.amount]}>Amount</Text>
          </View>
          {estimate.line_items?.map((item: any) => (
            <View key={item.id} style={styles.tableRow}>
              <Text style={[styles.tableCell, styles.description]}>{item.description}</Text>
              <Text style={[styles.tableCell, styles.quantity]}>
                {item.quantity} {item.unit || ''}
              </Text>
              <Text style={[styles.tableCell, styles.rate]}>${item.rate?.toFixed(2)}</Text>
              <Text style={[styles.tableCell, styles.amount]}>${item.amount?.toFixed(2)}</Text>
            </View>
          ))}
        </View>

        {/* Totals */}
        <View style={styles.totals}>
          {hasMixedTax ? (
            // Show breakdown when mixed
            <>
              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>Taxable:</Text>
                <Text style={styles.totalValue}>${(estimate as any).taxable_subtotal?.toFixed(2)}</Text>
              </View>
              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>Exempt:</Text>
                <Text style={styles.totalValue}>${(estimate as any).exempt_subtotal?.toFixed(2)}</Text>
              </View>
              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>Subtotal:</Text>
                <Text style={styles.totalValue}>${estimate.subtotal?.toFixed(2)}</Text>
              </View>
            </>
          ) : (
            // Show simple subtotal when all taxable or all exempt
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Subtotal:</Text>
              <Text style={styles.totalValue}>${estimate.subtotal?.toFixed(2)}</Text>
            </View>
          )}

          {estimate.tax_amount > 0 && (
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Total Tax:</Text>
              <Text style={styles.totalValue}>${estimate.tax_amount?.toFixed(2)}</Text>
            </View>
          )}

          {hasAnyExemptItems && estimate.tax_amount === 0 && (
            <View style={styles.totalRow}>
              <Text style={[styles.totalLabel, styles.exemptLabel]}>Tax:</Text>
              <Text style={[styles.totalValue, styles.exemptLabel]}>Exempt</Text>
            </View>
          )}

          <View style={[styles.totalRow, styles.grandTotal]}>
            <Text style={[styles.totalLabel, { fontSize: 11 }]}>Total:</Text>
            <Text style={[styles.totalValue, { fontSize: 11 }]}>${estimate.total?.toFixed(2)}</Text>
          </View>
        </View>

        {estimate.notes && (
          <View style={styles.notes}>
            <Text style={styles.notesTitle}>Notes</Text>
            <Text style={styles.notesText}>{estimate.notes}</Text>
          </View>
        )}
      </Page>
    </Document>
  )
}

interface InvoiceDocumentProps {
  invoice: any
  client: any
  business: any
}

export function InvoicePDF({ invoice, client, business }: InvoiceDocumentProps) {
  // Determine if we should show tax breakdown
  const hasMixedTax = (invoice as any).taxable_subtotal > 0 && (invoice as any).exempt_subtotal > 0
  const hasAnyExemptItems = invoice.line_items?.some((item: any) => (item as any).tax_rate === 0)

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          {business?.logo_url && (
            // eslint-disable-next-line jsx-a11y/alt-text
            <Image src={business.logo_url} style={styles.logo} />
          )}
          <Text style={styles.businessName}>{business?.name || 'Your Business'}</Text>
          {business?.address && <Text style={styles.businessInfo}>{business.address}</Text>}
          {business?.phone && <Text style={styles.businessInfo}>{business.phone}</Text>}
          {business?.email && <Text style={styles.businessInfo}>{business.email}</Text>}
        </View>

        {/* Title */}
        <Text style={styles.title}>INVOICE</Text>
        <Text style={styles.documentNumber}>{invoice.invoice_number}</Text>

        {/* Info Section */}
        <View style={styles.infoSection}>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Client:</Text>
            <Text style={styles.infoValue}>{client?.name}</Text>
          </View>
          {client?.email && (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Email:</Text>
              <Text style={styles.infoValue}>{client.email}</Text>
            </View>
          )}
          {client?.phone && (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Phone:</Text>
              <Text style={styles.infoValue}>{client.phone}</Text>
            </View>
          )}
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Issue Date:</Text>
            <Text style={styles.infoValue}>
              {new Date(invoice.issue_date).toLocaleDateString()}
            </Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Due Date:</Text>
            <Text style={styles.infoValue}>
              {new Date(invoice.due_date).toLocaleDateString()}
            </Text>
          </View>
        </View>

        {/* Line Items Table */}
        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <Text style={[styles.tableHeaderCell, styles.description]}>Description</Text>
            <Text style={[styles.tableHeaderCell, styles.quantity]}>Qty</Text>
            <Text style={[styles.tableHeaderCell, styles.rate]}>Rate</Text>
            <Text style={[styles.tableHeaderCell, styles.amount]}>Amount</Text>
          </View>
          {invoice.line_items?.map((item: any) => (
            <View key={item.id} style={styles.tableRow}>
              <Text style={[styles.tableCell, styles.description]}>{item.description}</Text>
              <Text style={[styles.tableCell, styles.quantity]}>
                {item.quantity} {item.unit || ''}
              </Text>
              <Text style={[styles.tableCell, styles.rate]}>${item.rate?.toFixed(2)}</Text>
              <Text style={[styles.tableCell, styles.amount]}>${item.amount?.toFixed(2)}</Text>
            </View>
          ))}
        </View>

        {/* Totals */}
        <View style={styles.totals}>
          {hasMixedTax ? (
            // Show breakdown when mixed
            <>
              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>Taxable:</Text>
                <Text style={styles.totalValue}>${(invoice as any).taxable_subtotal?.toFixed(2)}</Text>
              </View>
              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>Exempt:</Text>
                <Text style={styles.totalValue}>${(invoice as any).exempt_subtotal?.toFixed(2)}</Text>
              </View>
              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>Subtotal:</Text>
                <Text style={styles.totalValue}>${invoice.subtotal?.toFixed(2)}</Text>
              </View>
            </>
          ) : (
            // Show simple subtotal when all taxable or all exempt
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Subtotal:</Text>
              <Text style={styles.totalValue}>${invoice.subtotal?.toFixed(2)}</Text>
            </View>
          )}

          {invoice.tax_amount > 0 && (
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Total Tax:</Text>
              <Text style={styles.totalValue}>${invoice.tax_amount?.toFixed(2)}</Text>
            </View>
          )}

          {hasAnyExemptItems && invoice.tax_amount === 0 && (
            <View style={styles.totalRow}>
              <Text style={[styles.totalLabel, styles.exemptLabel]}>Tax:</Text>
              <Text style={[styles.totalValue, styles.exemptLabel]}>Exempt</Text>
            </View>
          )}

          {invoice.late_fee_amount > 0 && (
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Late Fees:</Text>
              <Text style={styles.totalValue}>${invoice.late_fee_amount?.toFixed(2)}</Text>
            </View>
          )}

          <View style={[styles.totalRow, styles.grandTotal]}>
            <Text style={[styles.totalLabel, { fontSize: 11 }]}>Total Due:</Text>
            <Text style={[styles.totalValue, { fontSize: 11 }]}>
              ${invoice.amount_due?.toFixed(2)}
            </Text>
          </View>
        </View>

        {/* Payment Summary */}
        {invoice.amount_paid > 0 && (
          <View style={styles.totals}>
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Amount Paid:</Text>
              <Text style={styles.totalValue}>${invoice.amount_paid?.toFixed(2)}</Text>
            </View>
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Balance Due:</Text>
              <Text style={[styles.totalValue, { color: '#d97706' }]}>
                ${(invoice.amount_due - invoice.amount_paid)?.toFixed(2)}
              </Text>
            </View>
          </View>
        )}

        {invoice.notes && (
          <View style={styles.notes}>
            <Text style={styles.notesTitle}>Notes</Text>
            <Text style={styles.notesText}>{invoice.notes}</Text>
          </View>
        )}
      </Page>
    </Document>
  )
}

'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Search, User, Mail, Phone, X, Check } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Client {
  id: string
  name: string
  email?: string | null
  phone?: string | null
}

interface ClientSearchInputProps {
  clients: Client[]
  preselectedClientId?: string
  onClientSelect?: (clientId: string) => void
  onNewClientData?: (data: { name: string; email: string; phone: string }) => void
  disabled?: boolean
}

export function ClientSearchInput({
  clients,
  preselectedClientId,
  onClientSelect,
  onNewClientData,
  disabled = false,
}: ClientSearchInputProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [filteredClients, setFilteredClients] = useState<Client[]>([])
  const [showDropdown, setShowDropdown] = useState(false)
  const [selectedClient, setSelectedClient] = useState<Client | null>(null)
  const [isNewClient, setIsNewClient] = useState(false)
  const [focusedIndex, setFocusedIndex] = useState(-1)
  const [newClientEmail, setNewClientEmail] = useState('')
  const [newClientPhone, setNewClientPhone] = useState('')
  const [emailError, setEmailError] = useState('')
  const [selectedNewClient, setSelectedNewClient] = useState<{ name: string; email: string; phone: string } | null>(null)

  const searchInputRef = useRef<HTMLInputElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Handle preselected client
  useEffect(() => {
    if (preselectedClientId && clients.length > 0) {
      const preselected = clients.find(c => c.id === preselectedClientId)
      if (preselected) {
        setSelectedClient(preselected)
        setSearchQuery(preselected.name)
        onClientSelect?.(preselected.id)
      }
    }
  }, [preselectedClientId, clients, onClientSelect])

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchQuery.trim()) {
        const filtered = clients.filter(client =>
          client.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          client.email?.toLowerCase().includes(searchQuery.toLowerCase())
        )
        setFilteredClients(filtered)

        // Check if this is a new client (no exact match)
        const exactMatch = filtered.find(
          c => c.name.toLowerCase() === searchQuery.toLowerCase()
        )
        setIsNewClient(!exactMatch && searchQuery.trim().length > 0)
        setShowDropdown(true)
        setFocusedIndex(-1)
      } else {
        setFilteredClients([])
        setShowDropdown(false)
        setIsNewClient(false)
      }
    }, 300)

    return () => clearTimeout(timer)
  }, [searchQuery, clients])

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        searchInputRef.current &&
        !searchInputRef.current.contains(event.target as Node)
      ) {
        setShowDropdown(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleClientSelect = (client: Client) => {
    setSelectedClient(client)
    setSearchQuery(client.name)
    setShowDropdown(false)
    setIsNewClient(false)
    setNewClientEmail('')
    setNewClientPhone('')
    setEmailError('')
    onClientSelect?.(client.id)
  }

  const handleClearSelection = () => {
    setSelectedClient(null)
    setSelectedNewClient(null)
    setSearchQuery('')
    setShowDropdown(false)
    setIsNewClient(false)
    setNewClientEmail('')
    setNewClientPhone('')
    setEmailError('')
    onClientSelect?.('')
  }

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!email.trim()) {
      setEmailError('Email is required')
      return false
    }
    if (!emailRegex.test(email.trim())) {
      setEmailError('Please enter a valid email address')
      return false
    }
    setEmailError('')
    return true
  }

  const handleNewClientSubmit = () => {
    if (!searchQuery.trim()) return

    if (!validateEmail(newClientEmail)) {
      return
    }

    const newClientData = {
      name: searchQuery.trim(),
      email: newClientEmail.trim(),
      phone: newClientPhone.trim(),
    }

    // Set the new client as selected
    setSelectedNewClient(newClientData)

    // Clear the new client form
    setNewClientEmail('')
    setNewClientPhone('')
    setEmailError('')
    setIsNewClient(false)
    setShowDropdown(false)

    // Notify parent component
    onNewClientData?.(newClientData)
  }

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!showDropdown || filteredClients.length === 0) return

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        setFocusedIndex(prev =>
          prev < filteredClients.length - 1 ? prev + 1 : prev
        )
        break
      case 'ArrowUp':
        e.preventDefault()
        setFocusedIndex(prev => (prev > 0 ? prev - 1 : -1))
        break
      case 'Enter':
        e.preventDefault()
        if (focusedIndex >= 0 && filteredClients[focusedIndex]) {
          handleClientSelect(filteredClients[focusedIndex])
        }
        break
      case 'Escape':
        setShowDropdown(false)
        setFocusedIndex(-1)
        break
    }
  }

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="client-search">Client *</Label>
        <div className="relative">
          <div className="relative flex items-center">
            <Search className="absolute left-3 h-4 w-4 text-muted-foreground pointer-events-none" />
            <Input
              ref={searchInputRef}
              id="client-search"
              type="text"
              placeholder="Search existing clients or type new name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => {
                if (searchQuery.trim() && !selectedClient && !selectedNewClient) {
                  setShowDropdown(true)
                }
              }}
              onKeyDown={handleKeyDown}
              disabled={disabled || !!selectedClient || !!selectedNewClient}
              className={cn(
                "pl-9 pr-10",
                (selectedClient || selectedNewClient) && "border-primary"
              )}
            />
            {(selectedClient || selectedNewClient) && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-1 h-7 w-7 p-0"
                onClick={handleClearSelection}
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>

          {/* Dropdown */}
          {showDropdown && !selectedClient && !selectedNewClient && (
            <div
              ref={dropdownRef}
              className="absolute z-50 w-full mt-1 max-h-60 overflow-auto rounded-md border bg-popover text-popover-foreground shadow-md"
            >
              {filteredClients.length > 0 ? (
                filteredClients.map((client, index) => (
                  <button
                    key={client.id}
                    type="button"
                    onClick={() => handleClientSelect(client)}
                    className={cn(
                      "w-full px-3 py-2 text-left hover:bg-accent flex items-start gap-3 transition-colors",
                      focusedIndex === index && "bg-accent"
                    )}
                  >
                    <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                      <User className="h-4 w-4 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{client.name}</p>
                      {client.email && (
                        <p className="text-sm text-muted-foreground truncate">{client.email}</p>
                      )}
                    </div>
                  </button>
                ))
              ) : isNewClient ? (
                <div className="p-3">
                  <p className="text-sm text-muted-foreground mb-2">
                    Create new client: <span className="font-medium text-foreground">&ldquo;{searchQuery}&rdquo;</span>
                  </p>
                </div>
              ) : (
                <div className="p-3 text-sm text-muted-foreground text-center">
                  No clients found
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* New Client Form */}
      {isNewClient && !selectedClient && !selectedNewClient && (
        <div className="rounded-md border bg-muted/30 p-4 space-y-4">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
              <User className="h-4 w-4 text-primary" />
            </div>
            <div>
              <p className="font-medium">{searchQuery}</p>
              <p className="text-xs text-muted-foreground">New client</p>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="new-client-email">
              Email * <span className="text-xs text-muted-foreground">(required)</span>
            </Label>
            <div className="relative">
              <Mail className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground pointer-events-none" />
              <Input
                id="new-client-email"
                type="email"
                placeholder="client@example.com"
                value={newClientEmail}
                onChange={(e) => {
                  setNewClientEmail(e.target.value)
                  if (emailError) validateEmail(e.target.value)
                }}
                onBlur={() => validateEmail(newClientEmail)}
                className={cn("pl-9", emailError && "border-destructive")}
              />
            </div>
            {emailError && (
              <p className="text-xs text-destructive">{emailError}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="new-client-phone">
              Phone <span className="text-xs text-muted-foreground">(optional)</span>
            </Label>
            <div className="relative">
              <Phone className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground pointer-events-none" />
              <Input
                id="new-client-phone"
                type="tel"
                placeholder="(555) 123-4567"
                value={newClientPhone}
                onChange={(e) => setNewClientPhone(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>

          <Button
            type="button"
            onClick={handleNewClientSubmit}
            className="w-full"
            disabled={!newClientEmail.trim() || !!emailError}
          >
            <Check className="mr-2 h-4 w-4" />
            Add New Client
          </Button>
        </div>
      )}

      {/* Selected Client Display */}
      {selectedClient && (
        <div className="rounded-md border border-primary/50 bg-primary/5 p-3 flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
            <User className="h-5 w-5 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-medium truncate">{selectedClient.name}</p>
            {selectedClient.email && (
              <p className="text-sm text-muted-foreground truncate">{selectedClient.email}</p>
            )}
          </div>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleClearSelection}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      )}

      {/* Selected New Client Display */}
      {selectedNewClient && !selectedClient && (
        <div className="rounded-md border border-green-500/50 bg-green-500/5 p-3 flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-green-500/10 flex items-center justify-center shrink-0">
            <Check className="h-5 w-5 text-green-600" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <p className="font-medium truncate">{selectedNewClient.name}</p>
              <span className="text-xs bg-green-500/20 text-green-700 px-2 py-0.5 rounded-full">New</span>
            </div>
            <p className="text-sm text-muted-foreground truncate">{selectedNewClient.email}</p>
            {selectedNewClient.phone && (
              <p className="text-xs text-muted-foreground">{selectedNewClient.phone}</p>
            )}
          </div>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleClearSelection}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  )
}
